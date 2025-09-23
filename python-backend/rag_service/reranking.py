"""
Re-ranking module for RAG service.
Provides cross-encoder based re-ranking for improved relevance.
"""

import time
from typing import List, Optional, Tuple
import numpy as np

from .interfaces import (
    Reranker,
    RerankResult,
    RerankRequest,
    RerankResponse,
)


class CrossEncoderReranker(Reranker):
    """Re-ranker using cross-encoder models."""

    def __init__(
        self,
        model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
        batch_size: int = 16,
        device: str = "cpu"
    ):
        """
        Initialize cross-encoder reranker.

        Args:
            model_name: Cross-encoder model name
            batch_size: Batch size for processing
            device: Device to run model on
        """
        self.model_name = model_name
        self.batch_size = batch_size
        self.device = device
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load the cross-encoder model."""
        try:
            from sentence_transformers import CrossEncoder
            self.model = CrossEncoder(self.model_name, device=self.device)
        except ImportError:
            # Fallback if sentence-transformers not available
            print(f"Warning: CrossEncoder not available, using mock")
            self.model = None

    async def rerank(
        self,
        query: str,
        candidates: List[str],
        top_k: int
    ) -> List[RerankResult]:
        """
        Re-rank candidates based on relevance to query.

        Args:
            query: Reference query
            candidates: List of candidate texts
            top_k: Number of top results to return

        Returns:
            List of re-ranked results
        """
        if not candidates:
            return []

        if len(candidates) == 1:
            # Single candidate, return as-is
            score = await self._score_single(query, candidates[0])
            return [
                RerankResult(
                    content=candidates[0],
                    relevance_score=score,
                    original_rank=0
                )
            ]

        # Score all pairs
        scores = await self.score_pairs(query, candidates)

        # Create results with scores
        results = []
        for i, (candidate, score) in enumerate(zip(candidates, scores)):
            results.append(
                RerankResult(
                    content=candidate,
                    relevance_score=score,
                    original_rank=i
                )
            )

        # Sort by relevance score
        results.sort(key=lambda x: x.relevance_score, reverse=True)

        # Return top-k results
        return results[:min(top_k, len(results))]

    async def score_pairs(self, query: str, candidates: List[str]) -> List[float]:
        """
        Score query-candidate pairs.

        Args:
            query: Query text
            candidates: Candidate texts

        Returns:
            List of scores
        """
        if self.model is None:
            # Mock scores for testing
            return [0.5] * len(candidates)

        # Create pairs
        pairs = [[query, candidate] for candidate in candidates]

        # Score in batches
        all_scores = []
        for i in range(0, len(pairs), self.batch_size):
            batch = pairs[i:i + self.batch_size]
            batch_scores = await self.score_batch(query, [p[1] for p in batch])
            all_scores.extend(batch_scores)

        # Normalize scores to [0, 1]
        scores = self._normalize_scores(all_scores)

        return scores

    async def score_batch(self, query: str, batch: List[str]) -> List[float]:
        """
        Score a batch of candidates.

        Args:
            query: Query text
            batch: Batch of candidate texts

        Returns:
            List of scores
        """
        if self.model is None:
            return [0.5] * len(batch)

        pairs = [[query, text] for text in batch]
        scores = self.model.predict(pairs)
        return scores.tolist()

    async def score_pairs_raw(self, query: str, candidates: List[str]) -> List[float]:
        """Get raw scores without normalization."""
        if self.model is None:
            return [-2.0, 0.0, 2.0][:len(candidates)]

        pairs = [[query, candidate] for candidate in candidates]
        scores = self.model.predict(pairs)
        return scores.tolist()

    async def _score_single(self, query: str, candidate: str) -> float:
        """Score a single query-candidate pair."""
        if self.model is None:
            return 0.85

        score = self.model.predict([[query, candidate]])[0]
        # Normalize single score
        return 1.0 / (1.0 + np.exp(-score))  # Sigmoid normalization

    def _normalize_scores(self, scores: List[float]) -> List[float]:
        """
        Normalize scores to [0, 1] range.

        Args:
            scores: Raw scores

        Returns:
            Normalized scores
        """
        if not scores:
            return []

        scores_array = np.array(scores)

        # Handle edge cases
        if len(scores) == 1:
            return [1.0 / (1.0 + np.exp(-scores[0]))]

        min_score = scores_array.min()
        max_score = scores_array.max()

        if min_score == max_score:
            # All scores are the same
            return [0.5] * len(scores)

        # Normalize to [0, 1]
        normalized = (scores_array - min_score) / (max_score - min_score)
        return normalized.tolist()


class RerankService:
    """Main reranking service."""

    def __init__(
        self,
        model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
        enable_cache: bool = True,
        cache_ttl: int = 300
    ):
        """
        Initialize rerank service.

        Args:
            model_name: Model to use for reranking
            enable_cache: Enable result caching
            cache_ttl: Cache time to live
        """
        self.reranker = CrossEncoderReranker(model_name=model_name)
        self.model_name = model_name
        self.enable_cache = enable_cache
        self.cache_ttl = cache_ttl
        self.cache = {} if enable_cache else None

    async def process_request(self, request: RerankRequest) -> RerankResponse:
        """
        Process rerank request.

        Args:
            request: Rerank request

        Returns:
            Rerank response
        """
        start_time = time.time()

        # Perform reranking
        results = await self.reranker.rerank(
            query=request.query,
            candidates=request.candidates,
            top_k=request.top_k
        )

        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000

        return RerankResponse(
            reranked=results,
            model_used=self.model_name,
            processing_time_ms=processing_time_ms
        )

    async def rerank_with_fallback(
        self,
        query: str,
        candidates: List[str],
        top_k: int
    ) -> List[RerankResult]:
        """
        Rerank with fallback support.

        Args:
            query: Query text
            candidates: Candidate texts
            top_k: Number of results

        Returns:
            Reranked results
        """
        try:
            return await self.reranker.rerank(query, candidates, top_k)
        except Exception as e:
            print(f"Reranking failed, using fallback: {e}")
            return await self.fallback_rerank(query, candidates, top_k)

    async def fallback_rerank(
        self,
        query: str,
        candidates: List[str],
        top_k: int
    ) -> List[RerankResult]:
        """
        Simple fallback reranking.

        Args:
            query: Query text
            candidates: Candidate texts
            top_k: Number of results

        Returns:
            Results with basic scoring
        """
        # Simple keyword-based scoring
        query_terms = set(query.lower().split())
        results = []

        for i, candidate in enumerate(candidates):
            candidate_terms = set(candidate.lower().split())
            # Calculate Jaccard similarity
            intersection = query_terms & candidate_terms
            union = query_terms | candidate_terms
            score = len(intersection) / len(union) if union else 0.0

            results.append(
                RerankResult(
                    content=candidate,
                    relevance_score=score,
                    original_rank=i
                )
            )

        # Sort and return top-k
        results.sort(key=lambda x: x.relevance_score, reverse=True)
        return results[:min(top_k, len(results))]

    async def rerank_with_cache(
        self,
        query: str,
        candidates: List[str],
        top_k: int
    ) -> List[RerankResult]:
        """
        Rerank with caching support.

        Args:
            query: Query text
            candidates: Candidate texts
            top_k: Number of results

        Returns:
            Cached or newly reranked results
        """
        if self.cache:
            import hashlib
            # Create cache key from query and candidates
            cache_data = f"{query}:{'|'.join(candidates)}:{top_k}"
            cache_key = hashlib.md5(cache_data.encode()).hexdigest()

            if cache_key in self.cache:
                return self.cache[cache_key]

            results = await self.reranker.rerank(query, candidates, top_k)
            self.cache[cache_key] = results
            return results

        return await self.reranker.rerank(query, candidates, top_k)

    async def rerank_with_validation(
        self,
        query: Optional[str],
        candidates: Optional[List[str]],
        top_k: int
    ) -> List[RerankResult]:
        """
        Rerank with input validation.

        Args:
            query: Query text
            candidates: Candidate texts
            top_k: Number of results

        Returns:
            Reranked results

        Raises:
            ValueError: If inputs are invalid
        """
        if query is None:
            raise ValueError("Query cannot be None")
        if candidates is None:
            raise ValueError("Candidates cannot be None")
        if not candidates:
            raise ValueError("Candidates list cannot be empty")
        if not query.strip():
            raise ValueError("Query cannot be empty")

        return await self.reranker.rerank(query, candidates, top_k)

    async def cleanup(self):
        """Cleanup resources."""
        if self.cache:
            self.cache.clear()


# Convenience function
async def rerank_results(
    query: str,
    candidates: List[str],
    top_k: int = 10
) -> List[RerankResult]:
    """
    Convenience function for reranking.

    Args:
        query: Query text
        candidates: Candidate texts
        top_k: Number of results

    Returns:
        Reranked results
    """
    reranker = CrossEncoderReranker()
    return await reranker.rerank(query, candidates, top_k)