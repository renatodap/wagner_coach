"""
Interface definitions for the Python RAG service.
These interfaces define the contracts for all components.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel, Field


class ContentType(str, Enum):
    """Types of content that can be embedded and searched."""
    WORKOUT = "workout"
    GOAL = "goal"
    CONVERSATION = "conversation"
    PROGRESS = "progress"
    EXERCISE = "exercise"
    ACHIEVEMENT = "achievement"
    NUTRITION = "nutrition"
    ACTIVITY = "activity"


class SearchStrategy(str, Enum):
    """Search strategies available in the RAG pipeline."""
    SEMANTIC = "semantic"
    KEYWORD = "keyword"
    HYBRID = "hybrid"


class EmbeddingModel(str, Enum):
    """Available embedding models."""
    SENTENCE_TRANSFORMER = "sentence-transformers/all-MiniLM-L6-v2"
    OPENAI_SMALL = "text-embedding-3-small"
    OPENAI_LARGE = "text-embedding-3-large"
    CUSTOM_FITNESS = "wagner-coach/fitness-embeddings-v1"


# ============= Request/Response Models =============

class EmbeddingRequest(BaseModel):
    """Request model for embedding generation."""
    text: str = Field(..., min_length=1, max_length=8192)
    user_id: str = Field(..., pattern="^[a-f0-9-]{36}$")
    content_type: ContentType
    metadata: Optional[Dict[str, Any]] = None


class EmbeddingResponse(BaseModel):
    """Response model for embedding generation."""
    embedding: List[float]
    dimension: int
    model: str
    processing_time_ms: float


class HybridSearchRequest(BaseModel):
    """Request model for hybrid search."""
    query: str = Field(..., min_length=1, max_length=512)
    user_id: str = Field(..., pattern="^[a-f0-9-]{36}$")
    search_type: SearchStrategy = SearchStrategy.HYBRID
    limit: int = Field(default=10, ge=1, le=100)
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)
    content_types: Optional[List[ContentType]] = None


class SearchResult(BaseModel):
    """Individual search result."""
    content: str
    content_type: ContentType
    score: float = Field(ge=0.0, le=1.0)
    metadata: Dict[str, Any]
    source: str
    timestamp: datetime


class HybridSearchResponse(BaseModel):
    """Response model for hybrid search."""
    results: List[SearchResult]
    search_strategy: SearchStrategy
    processing_time_ms: float
    total_results: int


class RerankRequest(BaseModel):
    """Request model for re-ranking."""
    query: str = Field(..., min_length=1, max_length=512)
    candidates: List[str] = Field(..., min_items=1, max_items=100)
    user_id: str = Field(..., pattern="^[a-f0-9-]{36}$")
    top_k: int = Field(default=10, ge=1, le=50)


class RerankResult(BaseModel):
    """Individual re-ranked result."""
    content: str
    relevance_score: float = Field(ge=0.0, le=1.0)
    original_rank: int


class RerankResponse(BaseModel):
    """Response model for re-ranking."""
    reranked: List[RerankResult]
    model_used: str
    processing_time_ms: float


class RAGQueryRequest(BaseModel):
    """Request model for complete RAG pipeline."""
    query: str = Field(..., min_length=1, max_length=512)
    user_id: str = Field(..., pattern="^[a-f0-9-]{36}$")
    include_context: List[ContentType] = Field(
        default_factory=lambda: list(ContentType)
    )
    max_context_items: int = Field(default=10, ge=1, le=50)
    use_reranking: bool = True
    search_strategy: SearchStrategy = SearchStrategy.HYBRID


class RAGContext(BaseModel):
    """Context item in RAG response."""
    source: str
    content: str
    relevance: float = Field(ge=0.0, le=1.0)
    content_type: ContentType
    metadata: Dict[str, Any]


class RAGQueryResponse(BaseModel):
    """Response model for RAG pipeline."""
    context: List[RAGContext]
    embeddings_used: List[str]
    search_strategy: SearchStrategy
    total_tokens: int
    processing_time_ms: float


# ============= Data Models =============

@dataclass
class Embedding:
    """Internal embedding data model."""
    id: str
    user_id: str
    content: str
    content_type: ContentType
    embedding_vector: List[float]
    model_name: str
    dimension: int
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: Optional[datetime] = None


# ============= Abstract Base Classes =============

class EmbeddingGenerator(ABC):
    """Abstract base class for embedding generation."""

    @abstractmethod
    async def generate(self, text: str) -> Tuple[List[float], str]:
        """
        Generate embedding for given text.

        Args:
            text: Input text to embed

        Returns:
            Tuple of (embedding_vector, model_name)
        """
        pass

    @abstractmethod
    async def batch_generate(
        self, texts: List[str]
    ) -> List[Tuple[List[float], str]]:
        """
        Generate embeddings for multiple texts.

        Args:
            texts: List of input texts

        Returns:
            List of tuples (embedding_vector, model_name)
        """
        pass


class SearchEngine(ABC):
    """Abstract base class for search operations."""

    @abstractmethod
    async def search(
        self,
        query: str,
        user_id: str,
        limit: int,
        threshold: float,
        **kwargs
    ) -> List[SearchResult]:
        """
        Perform search operation.

        Args:
            query: Search query
            user_id: User identifier
            limit: Maximum results to return
            threshold: Minimum relevance threshold
            **kwargs: Additional search parameters

        Returns:
            List of search results
        """
        pass


class Reranker(ABC):
    """Abstract base class for re-ranking operations."""

    @abstractmethod
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
        pass


class VectorStore(ABC):
    """Abstract base class for vector storage operations."""

    @abstractmethod
    async def store(self, embedding: Embedding) -> str:
        """
        Store embedding in vector database.

        Args:
            embedding: Embedding to store

        Returns:
            Stored embedding ID
        """
        pass

    @abstractmethod
    async def search_similar(
        self,
        query_vector: List[float],
        user_id: str,
        limit: int,
        threshold: float
    ) -> List[SearchResult]:
        """
        Search for similar vectors.

        Args:
            query_vector: Query embedding
            user_id: User identifier
            limit: Maximum results
            threshold: Similarity threshold

        Returns:
            List of similar results
        """
        pass

    @abstractmethod
    async def delete(self, embedding_id: str) -> bool:
        """
        Delete embedding from store.

        Args:
            embedding_id: ID of embedding to delete

        Returns:
            True if deleted, False otherwise
        """
        pass

    @abstractmethod
    async def update(self, embedding: Embedding) -> bool:
        """
        Update existing embedding.

        Args:
            embedding: Updated embedding data

        Returns:
            True if updated, False otherwise
        """
        pass


class Cache(ABC):
    """Abstract base class for caching operations."""

    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None
        """
        pass

    @abstractmethod
    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds

        Returns:
            True if set successfully
        """
        pass

    @abstractmethod
    async def delete(self, key: str) -> bool:
        """
        Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if deleted
        """
        pass

    @abstractmethod
    async def clear(self) -> bool:
        """
        Clear all cache entries.

        Returns:
            True if cleared
        """
        pass


class RAGPipeline(ABC):
    """Abstract base class for RAG pipeline."""

    @abstractmethod
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
        pass


# ============= Health Check Models =============

class HealthStatus(str, Enum):
    """Health status options."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class ComponentHealth(BaseModel):
    """Health status of a component."""
    name: str
    status: HealthStatus
    message: Optional[str] = None
    latency_ms: Optional[float] = None


class HealthCheckResponse(BaseModel):
    """Health check response model."""
    status: HealthStatus
    components: List[ComponentHealth]
    models_loaded: List[str]
    uptime_seconds: float
    timestamp: datetime


# ============= Error Models =============

class ErrorResponse(BaseModel):
    """Standard error response model."""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ValidationError(BaseModel):
    """Validation error details."""
    field: str
    message: str
    value: Optional[Any] = None


class ValidationErrorResponse(ErrorResponse):
    """Validation error response."""
    errors: List[ValidationError]