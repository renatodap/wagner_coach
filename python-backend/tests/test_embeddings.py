"""
Unit tests for embedding generation functionality.
These tests are written before implementation (TDD approach).
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
from typing import List

# These imports will fail initially (TDD - Red phase)
from rag_service.embeddings import (
    SentenceTransformerEmbedding,
    OpenAIEmbedding,
    EmbeddingService,
    generate_embedding,
    generate_embedding_with_fallback,
)
from rag_service.interfaces import (
    EmbeddingRequest,
    EmbeddingResponse,
    ContentType,
    EmbeddingModel,
)


class TestSentenceTransformerEmbedding:
    """Test cases for SentenceTransformer embedding generator."""

    @pytest.mark.asyncio
    async def test_generate_embedding_success(self):
        """Test successful embedding generation with sentence-transformers."""
        # Given
        text = "Complete 3 sets of 10 push-ups"
        expected_dimension = 384
        generator = SentenceTransformerEmbedding()

        # When
        embedding, model_name = await generator.generate(text)

        # Then
        assert len(embedding) == expected_dimension
        assert all(isinstance(x, float) for x in embedding)
        assert -1 <= min(embedding) <= max(embedding) <= 1
        assert model_name == EmbeddingModel.SENTENCE_TRANSFORMER

    @pytest.mark.asyncio
    async def test_generate_embedding_empty_text(self):
        """Test handling of empty text input."""
        # Given
        text = ""
        generator = SentenceTransformerEmbedding()

        # When/Then
        with pytest.raises(ValueError, match="Text cannot be empty"):
            await generator.generate(text)

    @pytest.mark.asyncio
    async def test_generate_embedding_long_text_truncation(self):
        """Test text truncation for long inputs."""
        # Given
        text = "word " * 1000  # Exceeds token limit
        max_tokens = 512
        generator = SentenceTransformerEmbedding(max_tokens=max_tokens)

        # When
        embedding, _ = await generator.generate(text)

        # Then
        assert len(embedding) == 384
        # Verify embedding was generated successfully despite long input

    @pytest.mark.asyncio
    async def test_batch_generate_embeddings(self):
        """Test batch embedding generation."""
        # Given
        texts = [
            "Bench press workout",
            "Running cardio session",
            "Yoga flexibility training"
        ]
        generator = SentenceTransformerEmbedding()

        # When
        embeddings = await generator.batch_generate(texts)

        # Then
        assert len(embeddings) == 3
        for embedding, model_name in embeddings:
            assert len(embedding) == 384
            assert model_name == EmbeddingModel.SENTENCE_TRANSFORMER

    @pytest.mark.asyncio
    async def test_embedding_normalization(self):
        """Test that embeddings are normalized."""
        # Given
        text = "Workout routine"
        generator = SentenceTransformerEmbedding()

        # When
        embedding, _ = await generator.generate(text)

        # Then
        # Check if embedding is normalized (magnitude ~1)
        magnitude = np.linalg.norm(embedding)
        assert 0.99 <= magnitude <= 1.01


class TestOpenAIEmbedding:
    """Test cases for OpenAI embedding generator."""

    @pytest.mark.asyncio
    async def test_openai_embedding_generation(self):
        """Test OpenAI embedding generation."""
        # Given
        text = "Strength training program"
        expected_dimension = 1536
        generator = OpenAIEmbedding(api_key="test-key")

        # Mock OpenAI API response
        with patch.object(generator, '_call_openai_api') as mock_api:
            mock_api.return_value = [0.1] * expected_dimension

            # When
            embedding, model_name = await generator.generate(text)

            # Then
            assert len(embedding) == expected_dimension
            assert model_name == EmbeddingModel.OPENAI_SMALL
            mock_api.assert_called_once_with(text)

    @pytest.mark.asyncio
    async def test_openai_api_error_handling(self):
        """Test OpenAI API error handling."""
        # Given
        text = "Test workout"
        generator = OpenAIEmbedding(api_key="test-key")

        # Mock API failure
        with patch.object(generator, '_call_openai_api') as mock_api:
            mock_api.side_effect = Exception("API Error")

            # When/Then
            with pytest.raises(Exception, match="API Error"):
                await generator.generate(text)

    @pytest.mark.asyncio
    async def test_openai_rate_limiting(self):
        """Test OpenAI rate limiting handling."""
        # Given
        text = "Workout"
        generator = OpenAIEmbedding(api_key="test-key", max_retries=3)

        # Mock rate limit error followed by success
        with patch.object(generator, '_call_openai_api') as mock_api:
            mock_api.side_effect = [
                Exception("Rate limit exceeded"),
                [0.1] * 1536  # Success on retry
            ]

            # When
            embedding, _ = await generator.generate(text)

            # Then
            assert len(embedding) == 1536
            assert mock_api.call_count == 2


class TestEmbeddingService:
    """Test cases for the main embedding service."""

    @pytest.mark.asyncio
    async def test_embedding_model_fallback(self):
        """Test fallback to OpenAI when sentence-transformers fails."""
        # Given
        text = "Test workout"
        service = EmbeddingService()

        # Mock sentence transformer failure
        with patch.object(
            service.sentence_transformer, 'generate',
            side_effect=Exception("Model loading failed")
        ):
            with patch.object(
                service.openai_embedding, 'generate',
                return_value=([0.1] * 1536, EmbeddingModel.OPENAI_SMALL)
            ):
                # When
                embedding, model_used = await service.generate_with_fallback(text)

                # Then
                assert model_used == EmbeddingModel.OPENAI_SMALL
                assert len(embedding) == 1536

    @pytest.mark.asyncio
    async def test_process_embedding_request(self):
        """Test processing complete embedding request."""
        # Given
        request = EmbeddingRequest(
            text="Bench press technique",
            user_id="test-user-123",
            content_type=ContentType.WORKOUT,
            metadata={"exercise": "bench_press"}
        )
        service = EmbeddingService()

        # Mock embedding generation
        with patch.object(
            service, 'generate_with_fallback',
            return_value=([0.1] * 384, EmbeddingModel.SENTENCE_TRANSFORMER)
        ):
            # When
            response = await service.process_request(request)

            # Then
            assert isinstance(response, EmbeddingResponse)
            assert response.dimension == 384
            assert response.model == EmbeddingModel.SENTENCE_TRANSFORMER
            assert len(response.embedding) == 384
            assert response.processing_time_ms > 0

    @pytest.mark.asyncio
    async def test_embedding_caching(self):
        """Test embedding caching for repeated texts."""
        # Given
        text = "Repeated workout description"
        service = EmbeddingService(enable_cache=True)

        # Mock cache
        cache_mock = AsyncMock()
        service.cache = cache_mock

        # First call - cache miss
        cache_mock.get.return_value = None

        with patch.object(
            service.sentence_transformer, 'generate',
            return_value=([0.1] * 384, EmbeddingModel.SENTENCE_TRANSFORMER)
        ) as mock_generate:
            # When
            embedding1, _ = await service.generate_with_fallback(text)

            # Cache hit on second call
            cache_mock.get.return_value = {
                'embedding': embedding1,
                'model': EmbeddingModel.SENTENCE_TRANSFORMER
            }

            embedding2, _ = await service.generate_with_fallback(text)

            # Then
            assert embedding1 == embedding2
            mock_generate.assert_called_once()  # Only called once due to cache
            cache_mock.get.assert_called()
            cache_mock.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_embedding_storage(self):
        """Test storing embeddings in database."""
        # Given
        embedding_data = {
            'user_id': 'test-user',
            'content': 'Workout plan',
            'content_type': ContentType.WORKOUT,
            'embedding': [0.1] * 384,
            'model': EmbeddingModel.SENTENCE_TRANSFORMER
        }
        service = EmbeddingService()

        # Mock database
        with patch.object(service, 'store_embedding') as mock_store:
            mock_store.return_value = "embedding-id-123"

            # When
            embedding_id = await service.store_embedding(embedding_data)

            # Then
            assert embedding_id == "embedding-id-123"
            mock_store.assert_called_once_with(embedding_data)

    @pytest.mark.asyncio
    async def test_concurrent_embedding_generation(self):
        """Test concurrent embedding generation."""
        # Given
        texts = [f"Workout {i}" for i in range(10)]
        service = EmbeddingService()

        # Mock embedding generation
        async def mock_generate(text):
            return [0.1] * 384, EmbeddingModel.SENTENCE_TRANSFORMER

        with patch.object(service, 'generate_with_fallback', side_effect=mock_generate):
            # When
            import asyncio
            embeddings = await asyncio.gather(*[
                service.generate_with_fallback(text) for text in texts
            ])

            # Then
            assert len(embeddings) == 10
            for embedding, model in embeddings:
                assert len(embedding) == 384

    @pytest.mark.asyncio
    async def test_embedding_dimension_validation(self):
        """Test validation of embedding dimensions."""
        # Given
        service = EmbeddingService()

        # Mock incompatible embedding dimensions
        with patch.object(
            service.sentence_transformer, 'generate',
            return_value=([0.1] * 100, EmbeddingModel.SENTENCE_TRANSFORMER)
        ):
            # When/Then
            with pytest.raises(ValueError, match="Unexpected embedding dimension"):
                await service.generate_with_fallback("test", expected_dim=384)


class TestEmbeddingIntegration:
    """Integration tests for embedding functionality."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_end_to_end_embedding_pipeline(self):
        """Test complete embedding pipeline from request to storage."""
        # Given
        request = EmbeddingRequest(
            text="Complete workout routine with squats and deadlifts",
            user_id="test-user-456",
            content_type=ContentType.WORKOUT,
            metadata={"difficulty": "intermediate"}
        )

        # When
        from rag_service.main import process_embedding_request
        response = await process_embedding_request(request)

        # Then
        assert response.dimension in [384, 1536]  # Depending on model used
        assert response.processing_time_ms < 1000  # Should be fast
        assert len(response.embedding) == response.dimension

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_embedding_retrieval(self):
        """Test retrieving stored embeddings."""
        # Given
        # First store an embedding
        embedding_data = {
            'user_id': 'test-user',
            'content': 'Test content',
            'embedding': [0.1] * 384
        }

        from rag_service.storage import store_and_retrieve_embedding
        embedding_id = await store_and_retrieve_embedding(embedding_data)

        # When
        retrieved = await retrieve_embedding(embedding_id)

        # Then
        assert retrieved['content'] == 'Test content'
        assert len(retrieved['embedding']) == 384


@pytest.fixture
def mock_sentence_transformer_model():
    """Mock sentence transformer model for testing."""
    model = Mock()
    model.encode.return_value = np.random.randn(384)
    return model


@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for testing."""
    client = Mock()
    client.embeddings.create.return_value = Mock(
        data=[Mock(embedding=[0.1] * 1536)]
    )
    return client


@pytest.fixture
async def test_embedding_service():
    """Provide configured embedding service for tests."""
    service = EmbeddingService(
        sentence_transformer_model="all-MiniLM-L6-v2",
        openai_api_key="test-key",
        enable_cache=True
    )
    yield service
    # Cleanup
    await service.cleanup()