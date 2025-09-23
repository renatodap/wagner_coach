"""
Unit tests for search functionality.
These tests are written before implementation (TDD approach).
"""

import pytest
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
from typing import List, Dict

# These imports will fail initially (TDD - Red phase)
from rag_service.search import (
    SemanticSearch,
    KeywordSearch,
    HybridSearch,
    SearchService,
)
from rag_service.interfaces import (
    HybridSearchRequest,
    HybridSearchResponse,
    SearchResult,
    SearchStrategy,
    ContentType,
)


class TestSemanticSearch:
    """Test cases for semantic search functionality."""

    @pytest.mark.asyncio
    async def test_semantic_search_relevance(self):
        """Test semantic search returns relevant results."""
        # Given
        query = "upper body strength workout"
        user_id = "test-user"

        # Mock embeddings with semantic similarity
        mock_embeddings = {
            "doc1": {
                "content": "bench press workout",
                "embedding": [0.8, 0.2, 0.1],
                "content_type": ContentType.WORKOUT
            },
            "doc2": {
                "content": "running cardio",
                "embedding": [0.1, 0.9, 0.1],
                "content_type": ContentType.ACTIVITY
            },
            "doc3": {
                "content": "push up routine",
                "embedding": [0.7, 0.3, 0.1],
                "content_type": ContentType.WORKOUT
            }
        }

        search = SemanticSearch()

        # Mock vector store
        with patch.object(search, 'vector_store') as mock_store:
            mock_store.search_similar.return_value = [
                SearchResult(
                    content="bench press workout",
                    content_type=ContentType.WORKOUT,
                    score=0.85,
                    metadata={},
                    source="workout_db",
                    timestamp="2024-01-15T10:00:00"
                ),
                SearchResult(
                    content="push up routine",
                    content_type=ContentType.WORKOUT,
                    score=0.75,
                    metadata={},
                    source="workout_db",
                    timestamp="2024-01-15T10:00:00"
                ),
            ]

            # When
            results = await search.search(query, user_id, limit=10, threshold=0.5)

            # Then
            assert len(results) == 2
            assert results[0].content == "bench press workout"
            assert results[1].content == "push up routine"
            assert results[0].score > results[1].score

    @pytest.mark.asyncio
    async def test_semantic_search_threshold(self):
        """Test semantic search respects similarity threshold."""
        # Given
        query = "yoga flexibility"
        user_id = "test-user"
        threshold = 0.7

        search = SemanticSearch()

        # Mock results with varying similarity scores
        mock_results = [
            SearchResult(content="yoga routine", score=0.8, content_type=ContentType.WORKOUT, metadata={}, source="db", timestamp="2024-01-15"),
            SearchResult(content="stretching", score=0.65, content_type=ContentType.WORKOUT, metadata={}, source="db", timestamp="2024-01-15"),
            SearchResult(content="pilates", score=0.55, content_type=ContentType.WORKOUT, metadata={}, source="db", timestamp="2024-01-15"),
        ]

        with patch.object(search, 'vector_store') as mock_store:
            # Filter based on threshold
            mock_store.search_similar.return_value = [
                r for r in mock_results if r.score >= threshold
            ]

            # When
            results = await search.search(query, user_id, limit=10, threshold=threshold)

            # Then
            assert len(results) == 1
            assert all(r.score >= threshold for r in results)

    @pytest.mark.asyncio
    async def test_semantic_search_empty_results(self):
        """Test semantic search handles no matches."""
        # Given
        query = "obscure exercise nobody does"
        user_id = "test-user"

        search = SemanticSearch()

        with patch.object(search, 'vector_store') as mock_store:
            mock_store.search_similar.return_value = []

            # When
            results = await search.search(query, user_id, limit=10, threshold=0.5)

            # Then
            assert results == []


class TestKeywordSearch:
    """Test cases for keyword search functionality."""

    @pytest.mark.asyncio
    async def test_keyword_search_exact_match(self):
        """Test keyword search finds exact matches."""
        # Given
        query = "bench press"
        user_id = "test-user"

        documents = [
            {"content": "Bench press for chest development", "id": "doc1"},
            {"content": "Squats for leg strength", "id": "doc2"},
            {"content": "Incline bench press variation", "id": "doc3"}
        ]

        search = KeywordSearch()

        # Mock database full-text search
        with patch.object(search, 'database') as mock_db:
            mock_db.full_text_search.return_value = [
                SearchResult(
                    content="Bench press for chest development",
                    content_type=ContentType.WORKOUT,
                    score=1.0,
                    metadata={},
                    source="workout_db",
                    timestamp="2024-01-15"
                ),
                SearchResult(
                    content="Incline bench press variation",
                    content_type=ContentType.WORKOUT,
                    score=0.9,
                    metadata={},
                    source="workout_db",
                    timestamp="2024-01-15"
                ),
            ]

            # When
            results = await search.search(query, user_id, limit=10)

            # Then
            assert len(results) == 2
            assert all("bench press" in r.content.lower() for r in results)

    @pytest.mark.asyncio
    async def test_keyword_search_partial_match(self):
        """Test keyword search handles partial matches."""
        # Given
        query = "squat"
        user_id = "test-user"

        search = KeywordSearch()

        with patch.object(search, 'database') as mock_db:
            mock_db.full_text_search.return_value = [
                SearchResult(content="Squats for beginners", score=0.9, content_type=ContentType.WORKOUT, metadata={}, source="db", timestamp="2024-01-15"),
                SearchResult(content="Bulgarian split squats", score=0.8, content_type=ContentType.WORKOUT, metadata={}, source="db", timestamp="2024-01-15"),
                SearchResult(content="Goblet squat technique", score=0.8, content_type=ContentType.WORKOUT, metadata={}, source="db", timestamp="2024-01-15"),
            ]

            # When
            results = await search.search(query, user_id, limit=10)

            # Then
            assert len(results) == 3
            assert all("squat" in r.content.lower() for r in results)

    @pytest.mark.asyncio
    async def test_keyword_search_ranking(self):
        """Test keyword search result ranking."""
        # Given
        query = "protein shake recipe"
        user_id = "test-user"

        search = KeywordSearch()

        with patch.object(search, 'database') as mock_db:
            # Exact match should rank higher
            mock_db.full_text_search.return_value = [
                SearchResult(content="Protein shake recipe", score=1.0, content_type=ContentType.NUTRITION, metadata={}, source="db", timestamp="2024-01-15"),
                SearchResult(content="Best protein sources", score=0.6, content_type=ContentType.NUTRITION, metadata={}, source="db", timestamp="2024-01-15"),
                SearchResult(content="Post-workout shake", score=0.5, content_type=ContentType.NUTRITION, metadata={}, source="db", timestamp="2024-01-15"),
            ]

            # When
            results = await search.search(query, user_id, limit=10)

            # Then
            assert results[0].content == "Protein shake recipe"
            assert results[0].score > results[1].score > results[2].score


class TestHybridSearch:
    """Test cases for hybrid search functionality."""

    @pytest.mark.asyncio
    async def test_hybrid_search_combination(self):
        """Test hybrid search combines semantic and keyword results."""
        # Given
        query = "chest exercises"
        user_id = "test-user"
        alpha = 0.5  # Equal weight

        search = HybridSearch()

        # Mock semantic results
        semantic_results = [
            SearchResult(content="push-ups", score=0.8, content_type=ContentType.EXERCISE, metadata={}, source="db", timestamp="2024-01-15"),
            SearchResult(content="dips", score=0.7, content_type=ContentType.EXERCISE, metadata={}, source="db", timestamp="2024-01-15"),
        ]

        # Mock keyword results
        keyword_results = [
            SearchResult(content="chest fly", score=0.9, content_type=ContentType.EXERCISE, metadata={}, source="db", timestamp="2024-01-15"),
            SearchResult(content="chest press", score=0.8, content_type=ContentType.EXERCISE, metadata={}, source="db", timestamp="2024-01-15"),
        ]

        with patch.object(search.semantic_search, 'search', return_value=semantic_results):
            with patch.object(search.keyword_search, 'search', return_value=keyword_results):
                # When
                results = await search.search(query, user_id, limit=10, alpha=alpha)

                # Then
                # Should include results from both searches
                content_list = [r.content for r in results]
                assert "push-ups" in content_list
                assert "chest fly" in content_list
                assert len(results) <= len(semantic_results) + len(keyword_results)

    @pytest.mark.parametrize("alpha,expected_top", [
        (0.0, "keyword_match"),  # Pure keyword
        (1.0, "semantic_match"),  # Pure semantic
        (0.5, "hybrid_match"),    # Balanced
    ])
    @pytest.mark.asyncio
    async def test_hybrid_search_alpha_parameter(self, alpha, expected_top):
        """Test alpha parameter controls search strategy weight."""
        # Given
        query = "workout"
        user_id = "test-user"

        search = HybridSearch()

        # Mock results biased towards different strategies
        semantic_results = [
            SearchResult(content="semantic_match", score=0.9, content_type=ContentType.WORKOUT, metadata={}, source="db", timestamp="2024-01-15")
        ] if alpha > 0 else []

        keyword_results = [
            SearchResult(content="keyword_match", score=0.9, content_type=ContentType.WORKOUT, metadata={}, source="db", timestamp="2024-01-15")
        ] if alpha < 1 else []

        with patch.object(search.semantic_search, 'search', return_value=semantic_results):
            with patch.object(search.keyword_search, 'search', return_value=keyword_results):
                # When
                results = await search.search(query, user_id, limit=10, alpha=alpha)

                # Then
                if alpha == 0.0:
                    assert results[0].content == "keyword_match"
                elif alpha == 1.0:
                    assert results[0].content == "semantic_match"
                else:
                    assert len(results) > 0

    @pytest.mark.asyncio
    async def test_hybrid_search_deduplication(self):
        """Test hybrid search removes duplicate results."""
        # Given
        query = "squats"
        user_id = "test-user"

        search = HybridSearch()

        # Same content from both searches
        duplicate_result = SearchResult(
            content="Barbell squats",
            content_type=ContentType.EXERCISE,
            score=0.8,
            metadata={},
            source="db",
            timestamp="2024-01-15"
        )

        with patch.object(search.semantic_search, 'search', return_value=[duplicate_result]):
            with patch.object(search.keyword_search, 'search', return_value=[duplicate_result]):
                # When
                results = await search.search(query, user_id, limit=10)

                # Then
                # Should only appear once
                assert len(results) == 1
                assert results[0].content == "Barbell squats"


class TestSearchService:
    """Test cases for the main search service."""

    @pytest.mark.asyncio
    async def test_process_search_request(self):
        """Test processing complete search request."""
        # Given
        request = HybridSearchRequest(
            query="deadlift form",
            user_id="test-user-123",
            search_type=SearchStrategy.HYBRID,
            limit=5,
            threshold=0.6,
            content_types=[ContentType.WORKOUT, ContentType.EXERCISE]
        )

        service = SearchService()

        # Mock search results
        mock_results = [
            SearchResult(
                content="Proper deadlift technique",
                content_type=ContentType.EXERCISE,
                score=0.85,
                metadata={"difficulty": "intermediate"},
                source="exercise_db",
                timestamp="2024-01-15"
            )
        ]

        with patch.object(service, 'hybrid_search') as mock_search:
            mock_search.search.return_value = mock_results

            # When
            response = await service.process_request(request)

            # Then
            assert isinstance(response, HybridSearchResponse)
            assert len(response.results) == 1
            assert response.search_strategy == SearchStrategy.HYBRID
            assert response.processing_time_ms > 0

    @pytest.mark.asyncio
    async def test_search_strategy_selection(self):
        """Test correct search strategy is used based on request."""
        # Given
        service = SearchService()

        test_cases = [
            (SearchStrategy.SEMANTIC, 'semantic_search'),
            (SearchStrategy.KEYWORD, 'keyword_search'),
            (SearchStrategy.HYBRID, 'hybrid_search'),
        ]

        for strategy, expected_search in test_cases:
            request = HybridSearchRequest(
                query="test",
                user_id="test-user",
                search_type=strategy
            )

            # Mock the specific search
            with patch.object(service, expected_search) as mock_search:
                mock_search.search.return_value = []

                # When
                await service.process_request(request)

                # Then
                mock_search.search.assert_called_once()

    @pytest.mark.asyncio
    async def test_search_result_filtering(self):
        """Test filtering results by content type."""
        # Given
        request = HybridSearchRequest(
            query="fitness",
            user_id="test-user",
            content_types=[ContentType.WORKOUT]  # Only workouts
        )

        service = SearchService()

        # Mock results with different content types
        all_results = [
            SearchResult(content="Workout 1", content_type=ContentType.WORKOUT, score=0.9, metadata={}, source="db", timestamp="2024-01-15"),
            SearchResult(content="Nutrition tip", content_type=ContentType.NUTRITION, score=0.8, metadata={}, source="db", timestamp="2024-01-15"),
            SearchResult(content="Workout 2", content_type=ContentType.WORKOUT, score=0.7, metadata={}, source="db", timestamp="2024-01-15"),
        ]

        with patch.object(service.hybrid_search, 'search', return_value=all_results):
            # When
            response = await service.process_request(request)

            # Then
            # Should only include workout results
            assert len(response.results) == 2
            assert all(r.content_type == ContentType.WORKOUT for r in response.results)

    @pytest.mark.asyncio
    async def test_search_caching(self):
        """Test search result caching."""
        # Given
        query = "cached workout"
        user_id = "test-user"

        service = SearchService(enable_cache=True)

        # Mock cache and search
        cache_mock = AsyncMock()
        service.cache = cache_mock
        cache_mock.get.return_value = None  # Cache miss initially

        mock_results = [
            SearchResult(content="Result 1", content_type=ContentType.WORKOUT, score=0.8, metadata={}, source="db", timestamp="2024-01-15")
        ]

        with patch.object(service.hybrid_search, 'search', return_value=mock_results) as mock_search:
            # When - First search (cache miss)
            result1 = await service.search_with_cache(query, user_id)

            # Cache hit on second search
            cache_mock.get.return_value = mock_results
            result2 = await service.search_with_cache(query, user_id)

            # Then
            assert result1 == result2
            mock_search.assert_called_once()  # Only called once due to cache
            cache_mock.set.assert_called_once()


@pytest.fixture
def mock_vector_store():
    """Mock vector store for testing."""
    store = AsyncMock()
    store.search_similar.return_value = []
    return store


@pytest.fixture
def mock_database():
    """Mock database for testing."""
    db = AsyncMock()
    db.full_text_search.return_value = []
    return db


@pytest.fixture
async def test_search_service():
    """Provide configured search service for tests."""
    service = SearchService(
        enable_cache=True,
        cache_ttl=300
    )
    yield service
    await service.cleanup()