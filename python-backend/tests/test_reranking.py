"""
Unit tests for re-ranking functionality.
These tests are written before implementation (TDD approach).
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
from typing import List

# These imports will fail initially (TDD - Red phase)
from rag_service.reranking import (
    CrossEncoderReranker,
    RerankService,
    rerank_results,
)
from rag_service.interfaces import (
    RerankRequest,
    RerankResponse,
    RerankResult,
)


class TestCrossEncoderReranker:
    """Test cases for cross-encoder re-ranking."""

    @pytest.mark.asyncio
    async def test_rerank_improves_relevance(self):
        """Test re-ranking improves result relevance."""
        # Given
        query = "beginner chest workout"
        candidates = [
            "Advanced powerlifting routine",
            "Simple push-up progression for beginners",
            "Chest anatomy guide"
        ]

        reranker = CrossEncoderReranker()

        # Mock cross-encoder scores (higher = more relevant)
        with patch.object(reranker, 'score_pairs') as mock_score:
            # Scores reflecting true relevance to query
            mock_score.return_value = [
                0.3,  # Advanced powerlifting - low relevance
                0.95,  # Simple push-up for beginners - high relevance
                0.5,   # Chest anatomy - medium relevance
            ]

            # When
            reranked = await reranker.rerank(query, candidates, top_k=3)

            # Then
            assert reranked[0].content == "Simple push-up progression for beginners"
            assert reranked[0].relevance_score > 0.9
            assert reranked[0].original_rank == 1  # Was second in original list
            assert reranked[1].content == "Chest anatomy guide"
            assert reranked[2].content == "Advanced powerlifting routine"

    @pytest.mark.asyncio
    async def test_rerank_preserves_top_k(self):
        """Test re-ranking returns requested number of results."""
        # Given
        query = "workout"
        candidates = ["workout1", "workout2", "workout3", "workout4"]
        top_k = 2

        reranker = CrossEncoderReranker()

        with patch.object(reranker, 'score_pairs') as mock_score:
            mock_score.return_value = [0.8, 0.6, 0.9, 0.5]

            # When
            reranked = await reranker.rerank(query, candidates, top_k)

            # Then
            assert len(reranked) == top_k
            # Should return top 2 scored items
            assert reranked[0].relevance_score == 0.9
            assert reranked[1].relevance_score == 0.8

    @pytest.mark.asyncio
    async def test_rerank_empty_candidates(self):
        """Test re-ranking handles empty candidate list."""
        # Given
        query = "test query"
        candidates = []

        reranker = CrossEncoderReranker()

        # When
        reranked = await reranker.rerank(query, candidates, top_k=5)

        # Then
        assert reranked == []

    @pytest.mark.asyncio
    async def test_rerank_single_candidate(self):
        """Test re-ranking with single candidate."""
        # Given
        query = "strength training"
        candidates = ["Complete guide to strength training"]

        reranker = CrossEncoderReranker()

        with patch.object(reranker, 'score_pairs', return_value=[0.85]):
            # When
            reranked = await reranker.rerank(query, candidates, top_k=10)

            # Then
            assert len(reranked) == 1
            assert reranked[0].content == candidates[0]
            assert reranked[0].relevance_score == 0.85
            assert reranked[0].original_rank == 0

    @pytest.mark.asyncio
    async def test_rerank_batch_processing(self):
        """Test efficient batch processing of candidates."""
        # Given
        query = "cardio"
        # Large number of candidates
        candidates = [f"Cardio workout {i}" for i in range(100)]

        reranker = CrossEncoderReranker(batch_size=16)

        with patch.object(reranker, 'score_batch') as mock_batch:
            # Mock batch scoring
            mock_batch.side_effect = lambda q, batch: [0.5] * len(batch)

            # When
            await reranker.rerank(query, candidates, top_k=10)

            # Then
            # Should be called multiple times for batching
            assert mock_batch.call_count > 1
            total_processed = sum(len(call[0][1]) for call in mock_batch.call_args_list)
            assert total_processed == 100

    @pytest.mark.asyncio
    async def test_rerank_score_normalization(self):
        """Test score normalization to [0, 1] range."""
        # Given
        query = "test"
        candidates = ["doc1", "doc2", "doc3"]

        reranker = CrossEncoderReranker()

        # Mock raw scores that need normalization
        with patch.object(reranker, 'score_pairs_raw', return_value=[-2.0, 0.0, 2.0]):
            # When
            reranked = await reranker.rerank(query, candidates, top_k=3)

            # Then
            # Scores should be normalized to [0, 1]
            scores = [r.relevance_score for r in reranked]
            assert all(0 <= s <= 1 for s in scores)
            assert max(scores) == 1.0  # Highest score normalized to 1
            assert min(scores) == 0.0  # Lowest score normalized to 0


class TestRerankService:
    """Test cases for the main rerank service."""

    @pytest.mark.asyncio
    async def test_process_rerank_request(self):
        """Test processing complete rerank request."""
        # Given
        request = RerankRequest(
            query="effective ab exercises",
            candidates=[
                "Plank variations for core",
                "Running for weight loss",
                "Crunches and sit-ups guide"
            ],
            user_id="test-user-123",
            top_k=2
        )

        service = RerankService()

        # Mock reranking
        mock_results = [
            RerankResult(
                content="Plank variations for core",
                relevance_score=0.92,
                original_rank=0
            ),
            RerankResult(
                content="Crunches and sit-ups guide",
                relevance_score=0.88,
                original_rank=2
            ),
        ]

        with patch.object(service.reranker, 'rerank', return_value=mock_results):
            # When
            response = await service.process_request(request)

            # Then
            assert isinstance(response, RerankResponse)
            assert len(response.reranked) == 2
            assert response.model_used == "cross-encoder/ms-marco-MiniLM-L-6-v2"
            assert response.processing_time_ms > 0

    @pytest.mark.asyncio
    async def test_rerank_with_fallback(self):
        """Test fallback when primary reranker fails."""
        # Given
        query = "test"
        candidates = ["doc1", "doc2"]

        service = RerankService()

        # Mock primary reranker failure
        with patch.object(service.reranker, 'rerank', side_effect=Exception("Model error")):
            # Mock fallback to simple scoring
            with patch.object(service, 'fallback_rerank') as mock_fallback:
                mock_fallback.return_value = [
                    RerankResult(content="doc1", relevance_score=0.5, original_rank=0),
                    RerankResult(content="doc2", relevance_score=0.5, original_rank=1),
                ]

                # When
                results = await service.rerank_with_fallback(query, candidates, top_k=2)

                # Then
                assert len(results) == 2
                mock_fallback.assert_called_once()

    @pytest.mark.asyncio
    async def test_rerank_caching(self):
        """Test caching of rerank results."""
        # Given
        query = "cached query"
        candidates = ["doc1", "doc2"]

        service = RerankService(enable_cache=True)

        # Mock cache
        cache_mock = AsyncMock()
        service.cache = cache_mock
        cache_mock.get.return_value = None  # Cache miss initially

        mock_results = [
            RerankResult(content="doc1", relevance_score=0.8, original_rank=0)
        ]

        with patch.object(service.reranker, 'rerank', return_value=mock_results) as mock_rerank:
            # When - First call (cache miss)
            result1 = await service.rerank_with_cache(query, candidates, top_k=1)

            # Cache hit on second call
            cache_mock.get.return_value = mock_results
            result2 = await service.rerank_with_cache(query, candidates, top_k=1)

            # Then
            assert result1 == result2
            mock_rerank.assert_called_once()  # Only called once due to cache
            cache_mock.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_rerank_performance_monitoring(self):
        """Test performance monitoring of reranking."""
        # Given
        query = "test"
        candidates = ["doc" * 100] * 50  # Large documents

        service = RerankService()

        with patch.object(service.reranker, 'rerank') as mock_rerank:
            mock_rerank.return_value = []

            # When
            start_time = pytest.approx(0, abs=1)
            response = await service.process_request(
                RerankRequest(query=query, candidates=candidates, user_id="test", top_k=10)
            )

            # Then
            assert response.processing_time_ms > 0
            assert response.processing_time_ms < 5000  # Should complete within 5 seconds

    @pytest.mark.asyncio
    async def test_rerank_error_handling(self):
        """Test error handling in reranking."""
        # Given
        service = RerankService()

        # Test various error scenarios
        error_cases = [
            (None, "doc1", "Query cannot be None"),
            ("query", None, "Candidates cannot be None"),
            ("query", [], "Candidates list cannot be empty"),
            ("", ["doc1"], "Query cannot be empty"),
        ]

        for query, candidates, expected_error in error_cases:
            # When/Then
            with pytest.raises(ValueError, match=expected_error):
                await service.rerank_with_validation(query, candidates, top_k=1)


class TestRerankIntegration:
    """Integration tests for reranking functionality."""

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_end_to_end_reranking(self):
        """Test complete reranking pipeline."""
        # Given
        from rag_service.main import rerank_search_results

        search_results = [
            "Advanced Olympic lifting techniques",
            "Beginner's guide to weightlifting",
            "Nutrition for strength training",
            "Home workout with dumbbells",
        ]

        query = "simple exercises for beginners"

        # When
        reranked = await rerank_search_results(query, search_results, top_k=2)

        # Then
        assert len(reranked) == 2
        # Beginner's guide should rank higher
        assert "beginner" in reranked[0].lower()

    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_rerank_with_real_model(self):
        """Test reranking with actual model (if available)."""
        try:
            # Given
            from sentence_transformers import CrossEncoder
            model_available = True
        except ImportError:
            model_available = False

        if model_available:
            query = "protein sources for vegetarians"
            candidates = [
                "Chicken breast nutrition facts",
                "Plant-based protein guide",
                "Whey protein supplements",
            ]

            reranker = CrossEncoderReranker(model_name="cross-encoder/ms-marco-MiniLM-L-6-v2")

            # When
            results = await reranker.rerank(query, candidates, top_k=3)

            # Then
            # Plant-based should rank highest for vegetarian query
            assert "plant-based" in results[0].content.lower()


@pytest.fixture
def mock_cross_encoder():
    """Mock cross-encoder model for testing."""
    model = Mock()
    model.predict.return_value = np.array([0.5, 0.5, 0.5])
    return model


@pytest.fixture
async def test_rerank_service():
    """Provide configured rerank service for tests."""
    service = RerankService(
        model_name="cross-encoder/ms-marco-MiniLM-L-6-v2",
        enable_cache=True,
        cache_ttl=300
    )
    yield service
    await service.cleanup()