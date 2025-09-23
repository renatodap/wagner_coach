"""
Python RAG Service for Wagner Coach

Advanced Retrieval-Augmented Generation service providing:
- High-quality embeddings with sentence-transformers
- Hybrid search (semantic + keyword)
- Re-ranking for improved relevance
- Optimized context retrieval for AI coaching
"""

__version__ = "1.0.0"
__author__ = "Wagner Coach Team"

from .interfaces import (
    ContentType,
    SearchStrategy,
    EmbeddingModel,
    EmbeddingRequest,
    EmbeddingResponse,
    HybridSearchRequest,
    HybridSearchResponse,
    SearchResult,
    RerankRequest,
    RerankResponse,
    RAGQueryRequest,
    RAGQueryResponse,
    RAGContext,
    HealthCheckResponse,
    ErrorResponse,
)

__all__ = [
    "ContentType",
    "SearchStrategy",
    "EmbeddingModel",
    "EmbeddingRequest",
    "EmbeddingResponse",
    "HybridSearchRequest",
    "HybridSearchResponse",
    "SearchResult",
    "RerankRequest",
    "RerankResponse",
    "RAGQueryRequest",
    "RAGQueryResponse",
    "RAGContext",
    "HealthCheckResponse",
    "ErrorResponse",
]