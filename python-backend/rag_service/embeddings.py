"""
Embedding generation module for RAG service.
Provides multiple embedding strategies with fallback support.
"""

import time
import hashlib
import json
from typing import List, Tuple, Optional, Dict, Any
from sentence_transformers import SentenceTransformer
import numpy as np
import openai
from tenacity import retry, stop_after_attempt, wait_exponential

from .interfaces import (
    EmbeddingGenerator,
    EmbeddingRequest,
    EmbeddingResponse,
    EmbeddingModel,
    Embedding,
    ContentType,
)


class SentenceTransformerEmbedding(EmbeddingGenerator):
    """Generate embeddings using sentence-transformers."""

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        max_tokens: int = 512,
        device: str = "cpu"
    ):
        """
        Initialize sentence transformer embedding generator.

        Args:
            model_name: Name of the sentence transformer model
            max_tokens: Maximum number of tokens to process
            device: Device to run model on (cpu/cuda)
        """
        self.model_name = model_name
        self.max_tokens = max_tokens
        self.device = device
        self.model = None
        self._load_model()

    def _load_model(self):
        """Load the sentence transformer model."""
        try:
            self.model = SentenceTransformer(self.model_name, device=self.device)
            self.model.max_seq_length = self.max_tokens
        except Exception as e:
            raise RuntimeError(f"Failed to load model {self.model_name}: {e}")

    async def generate(self, text: str) -> Tuple[List[float], str]:
        """
        Generate embedding for given text.

        Args:
            text: Input text to embed

        Returns:
            Tuple of (embedding_vector, model_name)
        """
        if not text or text.strip() == "":
            raise ValueError("Text cannot be empty")

        # Truncate text if needed
        if len(text) > self.max_tokens * 4:  # Rough char to token ratio
            text = text[:self.max_tokens * 4]

        # Generate embedding
        embedding = self.model.encode(text, normalize_embeddings=True)

        # Handle both numpy arrays and lists
        if hasattr(embedding, 'tolist'):
            embedding = embedding.tolist()
        elif not isinstance(embedding, list):
            embedding = list(embedding)

        return embedding, EmbeddingModel.SENTENCE_TRANSFORMER

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
        if not texts:
            return []

        # Filter and truncate texts
        processed_texts = []
        for text in texts:
            if not text or text.strip() == "":
                raise ValueError("Text cannot be empty")
            if len(text) > self.max_tokens * 4:
                text = text[:self.max_tokens * 4]
            processed_texts.append(text)

        # Generate batch embeddings
        embeddings = self.model.encode(
            processed_texts,
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=False
        )

        return [
            (emb.tolist(), EmbeddingModel.SENTENCE_TRANSFORMER)
            for emb in embeddings
        ]


class OpenAIEmbedding(EmbeddingGenerator):
    """Generate embeddings using OpenAI API."""

    def __init__(
        self,
        api_key: str,
        model: str = "text-embedding-3-small",
        max_retries: int = 3
    ):
        """
        Initialize OpenAI embedding generator.

        Args:
            api_key: OpenAI API key
            model: OpenAI embedding model name
            max_retries: Maximum number of retry attempts
        """
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model
        self.max_retries = max_retries

    async def _call_openai_api(self, text: str) -> List[float]:
        """Call OpenAI API with retry logic."""
        @retry(
            stop=stop_after_attempt(self.max_retries),
            wait=wait_exponential(multiplier=1, min=4, max=10)
        )
        def _make_request():
            response = self.client.embeddings.create(
                model=self.model,
                input=text
            )
            return response.data[0].embedding

        return _make_request()

    async def generate(self, text: str) -> Tuple[List[float], str]:
        """
        Generate embedding using OpenAI API.

        Args:
            text: Input text to embed

        Returns:
            Tuple of (embedding_vector, model_name)
        """
        if not text or text.strip() == "":
            raise ValueError("Text cannot be empty")

        embedding = await self._call_openai_api(text)

        return embedding, EmbeddingModel.OPENAI_SMALL

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
        if not texts:
            return []

        # OpenAI supports batch embedding
        response = self.client.embeddings.create(
            model=self.model,
            input=texts
        )

        return [
            (data.embedding, EmbeddingModel.OPENAI_SMALL)
            for data in response.data
        ]


class EmbeddingService:
    """Main service for embedding generation with fallback support."""

    def __init__(
        self,
        sentence_transformer_model: str = "all-MiniLM-L6-v2",
        openai_api_key: Optional[str] = None,
        enable_cache: bool = True,
        cache_ttl: int = 3600
    ):
        """
        Initialize embedding service.

        Args:
            sentence_transformer_model: Model name for sentence transformers
            openai_api_key: OpenAI API key for fallback
            enable_cache: Enable caching of embeddings
            cache_ttl: Cache time to live in seconds
        """
        self.sentence_transformer = SentenceTransformerEmbedding(
            model_name=sentence_transformer_model
        )

        self.openai_embedding = None
        if openai_api_key:
            self.openai_embedding = OpenAIEmbedding(api_key=openai_api_key)

        self.enable_cache = enable_cache
        self.cache_ttl = cache_ttl
        self.cache = {} if enable_cache else None

    async def generate_with_fallback(
        self,
        text: str,
        expected_dim: Optional[int] = None
    ) -> Tuple[List[float], str]:
        """
        Generate embedding with fallback support.

        Args:
            text: Text to embed
            expected_dim: Expected embedding dimension for validation

        Returns:
            Tuple of (embedding, model_used)
        """
        # Check cache first
        if self.enable_cache:
            cache_key = self._get_cache_key(text)
            if cache_key in self.cache:
                cached = self.cache[cache_key]
                return cached['embedding'], cached['model']

        embedding = None
        model_used = None

        # Try sentence transformer first
        try:
            embedding, model_used = await self.sentence_transformer.generate(text)
        except Exception as e:
            print(f"Sentence transformer failed: {e}")

            # Fallback to OpenAI if available
            if self.openai_embedding:
                try:
                    embedding, model_used = await self.openai_embedding.generate(text)
                except Exception as e2:
                    raise Exception(f"All embedding methods failed: {e}, {e2}")
            else:
                raise e

        # Validate dimension if specified
        if expected_dim and len(embedding) != expected_dim:
            raise ValueError(
                f"Unexpected embedding dimension: got {len(embedding)}, expected {expected_dim}"
            )

        # Cache the result
        if self.enable_cache:
            self.cache[cache_key] = {
                'embedding': embedding,
                'model': model_used,
                'timestamp': time.time()
            }

        return embedding, model_used

    async def process_request(self, request: EmbeddingRequest) -> EmbeddingResponse:
        """
        Process embedding request.

        Args:
            request: Embedding request

        Returns:
            Embedding response
        """
        start_time = time.time()

        # Generate embedding
        embedding, model_used = await self.generate_with_fallback(request.text)

        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000

        return EmbeddingResponse(
            embedding=embedding,
            dimension=len(embedding),
            model=model_used,
            processing_time_ms=processing_time_ms
        )

    async def store_embedding(self, embedding_data: Dict[str, Any]) -> str:
        """
        Store embedding in database.

        Args:
            embedding_data: Embedding data to store

        Returns:
            Stored embedding ID
        """
        # This would connect to the actual database
        # For now, return a mock ID
        import uuid
        return str(uuid.uuid4())

    def _get_cache_key(self, text: str) -> str:
        """Generate cache key for text."""
        return hashlib.md5(text.encode()).hexdigest()

    async def cleanup(self):
        """Cleanup resources."""
        if self.cache:
            self.cache.clear()


# Convenience functions
async def generate_embedding(
    text: str,
    model: str = "all-MiniLM-L6-v2"
) -> List[float]:
    """
    Generate embedding for text.

    Args:
        text: Text to embed
        model: Model to use

    Returns:
        Embedding vector
    """
    generator = SentenceTransformerEmbedding(model_name=model)
    embedding, _ = await generator.generate(text)
    return embedding


async def generate_embedding_with_fallback(
    text: str,
    openai_key: Optional[str] = None
) -> Tuple[List[float], str]:
    """
    Generate embedding with fallback support.

    Args:
        text: Text to embed
        openai_key: OpenAI API key for fallback

    Returns:
        Tuple of (embedding, model_used)
    """
    service = EmbeddingService(openai_api_key=openai_key)
    return await service.generate_with_fallback(text)