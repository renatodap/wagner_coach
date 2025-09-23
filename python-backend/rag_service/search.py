"""
Search module for RAG service.
Provides semantic, keyword, and hybrid search capabilities.
"""

import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import numpy as np
from datetime import datetime

from .interfaces import (
    SearchEngine,
    SearchResult,
    ContentType,
    SearchStrategy,
    HybridSearchRequest,
    HybridSearchResponse,
)
from .embeddings import generate_embedding


class VectorStore:
    """Mock vector store for testing."""

    async def search_similar(
        self,
        query_vector: List[float],
        user_id: str,
        limit: int,
        threshold: float
    ) -> List[SearchResult]:
        """Mock similar vector search."""
        # In production, this would query pgvector
        return []


class Database:
    """Mock database for testing."""

    async def full_text_search(
        self,
        query: str,
        user_id: str,
        limit: int
    ) -> List[SearchResult]:
        """Mock full-text search."""
        # In production, this would query PostgreSQL
        return []


class SemanticSearch(SearchEngine):
    """Semantic search using vector similarity."""

    def __init__(self, vector_store: Optional[VectorStore] = None):
        """
        Initialize semantic search.

        Args:
            vector_store: Vector store instance
        """
        self.vector_store = vector_store or VectorStore()

    async def search(
        self,
        query: str,
        user_id: str,
        limit: int,
        threshold: float,
        **kwargs
    ) -> List[SearchResult]:
        """
        Perform semantic search.

        Args:
            query: Search query
            user_id: User identifier
            limit: Maximum results
            threshold: Similarity threshold
            **kwargs: Additional parameters

        Returns:
            List of search results
        """
        # Generate query embedding
        query_embedding = await generate_embedding(query)

        # Search for similar vectors
        results = await self.vector_store.search_similar(
            query_vector=query_embedding,
            user_id=user_id,
            limit=limit,
            threshold=threshold
        )

        return results


class KeywordSearch(SearchEngine):
    """Keyword-based search using full-text search."""

    def __init__(self, database: Optional[Database] = None):
        """
        Initialize keyword search.

        Args:
            database: Database instance
        """
        self.database = database or Database()

    async def search(
        self,
        query: str,
        user_id: str,
        limit: int,
        threshold: float = 0.0,
        **kwargs
    ) -> List[SearchResult]:
        """
        Perform keyword search.

        Args:
            query: Search query
            user_id: User identifier
            limit: Maximum results
            threshold: Not used for keyword search
            **kwargs: Additional parameters

        Returns:
            List of search results
        """
        results = await self.database.full_text_search(
            query=query,
            user_id=user_id,
            limit=limit
        )

        return results


class HybridSearch(SearchEngine):
    """Hybrid search combining semantic and keyword search."""

    def __init__(
        self,
        semantic_search: Optional[SemanticSearch] = None,
        keyword_search: Optional[KeywordSearch] = None
    ):
        """
        Initialize hybrid search.

        Args:
            semantic_search: Semantic search instance
            keyword_search: Keyword search instance
        """
        self.semantic_search = semantic_search or SemanticSearch()
        self.keyword_search = keyword_search or KeywordSearch()

    async def search(
        self,
        query: str,
        user_id: str,
        limit: int,
        threshold: float = 0.5,
        alpha: float = 0.5,
        **kwargs
    ) -> List[SearchResult]:
        """
        Perform hybrid search.

        Args:
            query: Search query
            user_id: User identifier
            limit: Maximum results
            threshold: Similarity threshold
            alpha: Weight for semantic search (0-1)
            **kwargs: Additional parameters

        Returns:
            List of combined search results
        """
        # Perform both searches
        semantic_results = []
        keyword_results = []

        if alpha > 0:
            semantic_results = await self.semantic_search.search(
                query=query,
                user_id=user_id,
                limit=limit * 2,  # Get more for merging
                threshold=threshold
            )

        if alpha < 1:
            keyword_results = await self.keyword_search.search(
                query=query,
                user_id=user_id,
                limit=limit * 2
            )

        # Combine results with weighted scores
        combined_results = self._combine_results(
            semantic_results,
            keyword_results,
            alpha,
            limit
        )

        return combined_results

    def _combine_results(
        self,
        semantic_results: List[SearchResult],
        keyword_results: List[SearchResult],
        alpha: float,
        limit: int
    ) -> List[SearchResult]:
        """
        Combine and deduplicate search results.

        Args:
            semantic_results: Results from semantic search
            keyword_results: Results from keyword search
            alpha: Weight for semantic search
            limit: Maximum results to return

        Returns:
            Combined and sorted results
        """
        # Create a dictionary to track combined scores
        combined = {}

        # Add semantic results
        for result in semantic_results:
            key = result.content  # Use content as key for deduplication
            if key not in combined:
                combined[key] = {
                    'result': result,
                    'score': 0.0
                }
            combined[key]['score'] += alpha * result.score

        # Add keyword results
        for result in keyword_results:
            key = result.content
            if key not in combined:
                combined[key] = {
                    'result': result,
                    'score': 0.0
                }
            combined[key]['score'] += (1 - alpha) * result.score

        # Sort by combined score
        sorted_items = sorted(
            combined.items(),
            key=lambda x: x[1]['score'],
            reverse=True
        )

        # Create final results
        final_results = []
        for _, item in sorted_items[:limit]:
            result = item['result']
            # Update score with combined score
            result.score = item['score']
            final_results.append(result)

        return final_results


class SearchService:
    """Main search service with strategy selection."""

    def __init__(
        self,
        enable_cache: bool = True,
        cache_ttl: int = 300
    ):
        """
        Initialize search service.

        Args:
            enable_cache: Enable result caching
            cache_ttl: Cache time to live in seconds
        """
        self.semantic_search = SemanticSearch()
        self.keyword_search = KeywordSearch()
        self.hybrid_search = HybridSearch(
            self.semantic_search,
            self.keyword_search
        )
        self.enable_cache = enable_cache
        self.cache_ttl = cache_ttl
        self.cache = {} if enable_cache else None

    async def process_request(
        self,
        request: HybridSearchRequest
    ) -> HybridSearchResponse:
        """
        Process search request.

        Args:
            request: Search request

        Returns:
            Search response
        """
        start_time = time.time()

        # Select search strategy
        search_engine = self._get_search_engine(request.search_type)

        # Perform search
        results = await search_engine.search(
            query=request.query,
            user_id=request.user_id,
            limit=request.limit,
            threshold=request.threshold
        )

        # Filter by content types if specified
        if request.content_types:
            results = [
                r for r in results
                if r.content_type in request.content_types
            ]

        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000

        return HybridSearchResponse(
            results=results,
            search_strategy=request.search_type,
            processing_time_ms=processing_time_ms,
            total_results=len(results)
        )

    async def search_with_cache(
        self,
        query: str,
        user_id: str
    ) -> List[SearchResult]:
        """
        Search with caching support.

        Args:
            query: Search query
            user_id: User identifier

        Returns:
            Search results
        """
        if self.cache:
            cache_key = f"{user_id}:{query}"
            if cache_key in self.cache:
                return self.cache[cache_key]

        results = await self.hybrid_search.search(
            query=query,
            user_id=user_id,
            limit=10,
            threshold=0.5
        )

        if self.cache:
            self.cache[cache_key] = results

        return results

    def _get_search_engine(self, strategy: SearchStrategy) -> SearchEngine:
        """Get search engine based on strategy."""
        if strategy == SearchStrategy.SEMANTIC:
            return self.semantic_search
        elif strategy == SearchStrategy.KEYWORD:
            return self.keyword_search
        else:  # HYBRID
            return self.hybrid_search

    async def cleanup(self):
        """Cleanup resources."""
        if self.cache:
            self.cache.clear()