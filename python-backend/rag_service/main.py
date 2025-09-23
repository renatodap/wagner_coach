"""
Main entry point for RAG service.
Provides high-level functions for the complete RAG pipeline.
"""

import os
from typing import List, Dict, Any, Optional
from datetime import datetime

from .embeddings import EmbeddingService
from .search import SearchService
from .reranking import RerankService
from .interfaces import (
    EmbeddingRequest,
    HybridSearchRequest,
    RerankRequest,
    RAGQueryRequest,
    RAGQueryResponse,
    RAGContext,
    SearchStrategy,
    ContentType,
)


class RAGPipeline:
    """Complete RAG pipeline implementation."""

    def __init__(
        self,
        openai_api_key: Optional[str] = None,
        enable_cache: bool = True
    ):
        """
        Initialize RAG pipeline.

        Args:
            openai_api_key: OpenAI API key for fallback
            enable_cache: Enable caching
        """
        self.embedding_service = EmbeddingService(
            openai_api_key=openai_api_key,
            enable_cache=enable_cache
        )
        self.search_service = SearchService(enable_cache=enable_cache)
        self.rerank_service = RerankService(enable_cache=enable_cache)

    async def process(
        self,
        request: RAGQueryRequest
    ) -> RAGQueryResponse:
        """
        Process RAG query through complete pipeline.

        Args:
            request: RAG query request

        Returns:
            RAG query response with context
        """
        import time
        start_time = time.time()

        # Step 1: Search for relevant content
        search_request = HybridSearchRequest(
            query=request.query,
            user_id=request.user_id,
            search_type=request.search_strategy,
            limit=request.max_context_items * 2,  # Get extra for reranking
            content_types=request.include_context
        )
        search_response = await self.search_service.process_request(search_request)

        # Step 2: Rerank results if enabled
        final_results = search_response.results
        if request.use_reranking and len(final_results) > 0:
            rerank_request = RerankRequest(
                query=request.query,
                candidates=[r.content for r in final_results],
                user_id=request.user_id,
                top_k=request.max_context_items
            )
            rerank_response = await self.rerank_service.process_request(rerank_request)

            # Map reranked results back to original search results
            reranked_content = {r.content: r for r in rerank_response.reranked}
            final_results = [
                result for result in search_response.results
                if result.content in reranked_content
            ]

            # Sort by rerank scores
            final_results.sort(
                key=lambda x: reranked_content[x.content].relevance_score,
                reverse=True
            )
            final_results = final_results[:request.max_context_items]

        # Step 3: Create context items
        context = []
        for result in final_results:
            context.append(
                RAGContext(
                    source=result.source,
                    content=result.content,
                    relevance=result.score,
                    content_type=result.content_type,
                    metadata=result.metadata
                )
            )

        # Calculate total tokens (approximate)
        total_tokens = sum(len(c.content.split()) for c in context) * 1.3

        processing_time_ms = (time.time() - start_time) * 1000

        return RAGQueryResponse(
            context=context,
            embeddings_used=["sentence-transformers/all-MiniLM-L6-v2"],
            search_strategy=request.search_strategy,
            total_tokens=int(total_tokens),
            processing_time_ms=processing_time_ms
        )


# Convenience functions for testing

async def process_embedding_request(request: EmbeddingRequest):
    """Process embedding request."""
    service = EmbeddingService()
    return await service.process_request(request)


async def store_and_retrieve_embedding(embedding_data: Dict[str, Any]) -> str:
    """Store embedding and return ID."""
    service = EmbeddingService()
    return await service.store_embedding(embedding_data)


async def retrieve_embedding(embedding_id: str) -> Dict[str, Any]:
    """Retrieve embedding by ID (mock implementation)."""
    # In production, this would query the database
    return {
        'id': embedding_id,
        'content': 'Test content',
        'embedding': [0.1] * 384
    }


async def rerank_search_results(
    query: str,
    search_results: List[str],
    top_k: int
) -> List[str]:
    """Rerank search results."""
    service = RerankService()
    results = await service.rerank_with_fallback(query, search_results, top_k)
    return [r.content for r in results]


async def rag_pipeline(query: str, user_id: str) -> Dict[str, Any]:
    """Execute RAG pipeline for query."""
    pipeline = RAGPipeline()
    request = RAGQueryRequest(
        query=query,
        user_id=user_id,
        search_strategy=SearchStrategy.HYBRID,
        max_context_items=5
    )
    response = await pipeline.process(request)

    return {
        "retrieved_contexts": [
            {
                "content": ctx.content,
                "relevance_score": ctx.relevance,
                "id": f"ctx-{i}"
            }
            for i, ctx in enumerate(response.context)
        ],
        "search_strategy": response.search_strategy,
        "total_tokens": response.total_tokens,
        "status": "success"
    }


async def get_coaching_context(query: str, user_id: str) -> Dict[str, Any]:
    """Get coaching context for user query."""
    result = await rag_pipeline(query, user_id)
    return {
        "sources": [
            {
                "content": ctx["content"],
                "relevance": ctx["relevance_score"]
            }
            for ctx in result["retrieved_contexts"]
        ],
        "total_tokens": result["total_tokens"],
        "status": result["status"]
    }