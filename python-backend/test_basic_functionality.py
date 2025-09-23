#!/usr/bin/env python
"""
Basic functionality test for RAG service.
Tests core components without external dependencies.
"""

import asyncio
import sys
sys.path.insert(0, '.')

from rag_service.interfaces import (
    EmbeddingRequest,
    EmbeddingResponse,
    HybridSearchRequest,
    SearchStrategy,
    ContentType,
    RerankRequest,
    RAGQueryRequest,
)


async def test_interfaces():
    """Test interface models."""
    print("Testing interface models...")

    # Test EmbeddingRequest
    req = EmbeddingRequest(
        text="Test workout",
        user_id="12345678-1234-1234-1234-123456789012",
        content_type=ContentType.WORKOUT
    )
    assert req.text == "Test workout"
    print("[PASS] EmbeddingRequest works")

    # Test HybridSearchRequest
    search_req = HybridSearchRequest(
        query="bench press",
        user_id="12345678-1234-1234-1234-123456789012",
        search_type=SearchStrategy.HYBRID,
        limit=10
    )
    assert search_req.query == "bench press"
    print("[PASS] HybridSearchRequest works")

    # Test RerankRequest
    rerank_req = RerankRequest(
        query="effective ab exercises",
        candidates=["plank", "crunches", "running"],
        user_id="12345678-1234-1234-1234-123456789012",
        top_k=2
    )
    assert len(rerank_req.candidates) == 3
    print("[PASS] RerankRequest works")

    # Test RAGQueryRequest
    rag_req = RAGQueryRequest(
        query="How to improve my bench press?",
        user_id="12345678-1234-1234-1234-123456789012",
        max_context_items=5
    )
    assert rag_req.search_strategy == SearchStrategy.HYBRID  # Default
    print("[PASS] RAGQueryRequest works")

    print("\n[SUCCESS] All interface tests passed!")


async def test_embeddings_mock():
    """Test embedding module with mocks."""
    print("\nTesting embedding module...")

    from unittest.mock import Mock, patch

    # Mock sentence transformers to avoid downloading models
    mock_model = Mock()
    mock_model.encode.return_value = [0.1] * 384

    with patch('rag_service.embeddings.SentenceTransformer', return_value=mock_model):
        from rag_service.embeddings import EmbeddingService

        service = EmbeddingService()

        # Test embedding generation
        req = EmbeddingRequest(
            text="Test workout",
            user_id="12345678-1234-1234-1234-123456789012",
            content_type=ContentType.WORKOUT
        )

        response = await service.process_request(req)

        assert isinstance(response, EmbeddingResponse)
        assert response.dimension == 384
        assert len(response.embedding) == 384
        print("[PASS] Embedding generation works")

    print("\n[SUCCESS] Embedding tests passed!")


async def test_search_service():
    """Test search service."""
    print("\nTesting search service...")

    from rag_service.search import SearchService

    service = SearchService()

    # Test search request processing
    req = HybridSearchRequest(
        query="bench press",
        user_id="12345678-1234-1234-1234-123456789012",
        search_type=SearchStrategy.HYBRID,
        limit=10
    )

    response = await service.process_request(req)

    assert response.search_strategy == SearchStrategy.HYBRID
    assert response.processing_time_ms >= 0
    print("[PASS] Search service works")

    print("\n[SUCCESS] Search tests passed!")


async def test_reranking_service():
    """Test reranking service."""
    print("\nTesting reranking service...")

    from rag_service.reranking import RerankService

    service = RerankService()

    # Test with fallback (no model loaded)
    results = await service.rerank_with_fallback(
        query="beginner workout",
        candidates=["advanced powerlifting", "simple push-ups for beginners"],
        top_k=2
    )

    assert len(results) <= 2
    print("[PASS] Reranking service works")

    print("\n[SUCCESS] Reranking tests passed!")


async def test_rag_pipeline():
    """Test complete RAG pipeline."""
    print("\nTesting RAG pipeline...")

    from rag_service.main import RAGPipeline

    pipeline = RAGPipeline()

    req = RAGQueryRequest(
        query="How to do squats?",
        user_id="12345678-1234-1234-1234-123456789012",
        max_context_items=3,
        use_reranking=False  # Disable to avoid model loading
    )

    response = await pipeline.process(req)

    assert response.search_strategy == SearchStrategy.HYBRID
    assert response.total_tokens >= 0
    assert response.processing_time_ms >= 0
    print("[PASS] RAG pipeline works")

    print("\n[SUCCESS] RAG pipeline tests passed!")


async def main():
    """Run all tests."""
    print("=" * 60)
    print("RAG Service Basic Functionality Tests")
    print("=" * 60)

    try:
        await test_interfaces()
        await test_embeddings_mock()
        await test_search_service()
        await test_reranking_service()
        await test_rag_pipeline()

        print("\n" + "=" * 60)
        print("[SUCCESS] ALL TESTS PASSED!")
        print("=" * 60)
        print("\nThe RAG service implementation is working correctly.")
        print("All core components are functional:")
        print("- Interface models [PASS]")
        print("- Embedding generation [PASS]")
        print("- Search service [PASS]")
        print("- Reranking service [PASS]")
        print("- RAG pipeline [PASS]")

    except Exception as e:
        print(f"\n[FAIL] Test failed: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)