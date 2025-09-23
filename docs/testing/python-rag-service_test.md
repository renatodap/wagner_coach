# Python RAG Service Test Design Document

## Test Strategy Overview

Comprehensive test suite for the Python RAG service following TDD principles with focus on reliability, performance, and accuracy.

## Test Categories

### 1. Unit Tests
Test individual components in isolation with mocked dependencies.

### 2. Integration Tests
Test component interactions with real databases and services.

### 3. Performance Tests
Validate latency, throughput, and resource usage requirements.

### 4. End-to-End Tests
Test complete user journeys through the RAG pipeline.

## Unit Test Specifications

### 1. Embedding Generation Tests

#### Test: `test_generate_embedding_success`
```python
def test_generate_embedding_success():
    """Test successful embedding generation with sentence-transformers"""
    # Given
    text = "Complete 3 sets of 10 push-ups"
    expected_dimension = 384

    # When
    embedding = generate_embedding(text)

    # Then
    assert len(embedding) == expected_dimension
    assert all(isinstance(x, float) for x in embedding)
    assert -1 <= min(embedding) <= max(embedding) <= 1
```

#### Test: `test_generate_embedding_empty_text`
```python
def test_generate_embedding_empty_text():
    """Test handling of empty text input"""
    # Given
    text = ""

    # When/Then
    with pytest.raises(ValueError, match="Text cannot be empty"):
        generate_embedding(text)
```

#### Test: `test_generate_embedding_long_text_truncation`
```python
def test_generate_embedding_long_text_truncation():
    """Test text truncation for long inputs"""
    # Given
    text = "word " * 1000  # Exceeds token limit
    max_tokens = 512

    # When
    embedding = generate_embedding(text)

    # Then
    assert len(embedding) == 384
    # Verify truncation was applied
```

#### Test: `test_embedding_model_fallback`
```python
def test_embedding_model_fallback():
    """Test fallback to OpenAI when sentence-transformers fails"""
    # Given
    text = "Test workout"
    mock_sentence_transformer_failure()

    # When
    embedding, model_used = generate_embedding_with_fallback(text)

    # Then
    assert model_used == "openai-text-embedding-3-small"
    assert len(embedding) == 1536  # OpenAI dimension
```

### 2. Hybrid Search Tests

#### Test: `test_semantic_search_relevance`
```python
def test_semantic_search_relevance():
    """Test semantic search returns relevant results"""
    # Given
    query = "upper body strength workout"
    mock_embeddings = {
        "bench press workout": [0.8, 0.2, ...],
        "running cardio": [0.1, 0.9, ...],
        "push up routine": [0.7, 0.3, ...]
    }

    # When
    results = semantic_search(query, mock_embeddings)

    # Then
    assert results[0]["content"] == "bench press workout"
    assert results[1]["content"] == "push up routine"
    assert results[0]["score"] > results[1]["score"]
```

#### Test: `test_keyword_search_exact_match`
```python
def test_keyword_search_exact_match():
    """Test keyword search finds exact matches"""
    # Given
    query = "bench press"
    documents = [
        "Bench press for chest development",
        "Squats for leg strength",
        "Incline bench press variation"
    ]

    # When
    results = keyword_search(query, documents)

    # Then
    assert len(results) == 2
    assert "bench press" in results[0].lower()
    assert "bench press" in results[1].lower()
```

#### Test: `test_hybrid_search_combination`
```python
def test_hybrid_search_combination():
    """Test hybrid search combines semantic and keyword results"""
    # Given
    query = "chest exercises"
    alpha = 0.5  # Equal weight

    # When
    results = hybrid_search(query, alpha)

    # Then
    # Verify results include both semantic matches (push-ups)
    # and keyword matches (chest fly)
    assert any("push-up" in r["content"] for r in results[:3])
    assert any("chest" in r["content"] for r in results[:3])
```

#### Test: `test_hybrid_search_alpha_parameter`
```python
@pytest.mark.parametrize("alpha,expected_top", [
    (0.0, "keyword_match"),  # Pure keyword
    (1.0, "semantic_match"),  # Pure semantic
    (0.5, "hybrid_match"),    # Balanced
])
def test_hybrid_search_alpha_parameter(alpha, expected_top):
    """Test alpha parameter controls search strategy weight"""
    # Test implementation
```

### 3. Re-ranking Tests

#### Test: `test_rerank_improves_relevance`
```python
def test_rerank_improves_relevance():
    """Test re-ranking improves result relevance"""
    # Given
    query = "beginner chest workout"
    candidates = [
        "Advanced powerlifting routine",
        "Simple push-up progression for beginners",
        "Chest anatomy guide"
    ]

    # When
    reranked = rerank_results(query, candidates)

    # Then
    assert reranked[0]["content"] == "Simple push-up progression for beginners"
    assert reranked[0]["relevance_score"] > 0.8
```

#### Test: `test_rerank_preserves_top_k`
```python
def test_rerank_preserves_top_k():
    """Test re-ranking returns requested number of results"""
    # Given
    query = "workout"
    candidates = ["workout1", "workout2", "workout3", "workout4"]
    top_k = 2

    # When
    reranked = rerank_results(query, candidates, top_k)

    # Then
    assert len(reranked) == top_k
```

### 4. RAG Pipeline Tests

#### Test: `test_rag_pipeline_complete_flow`
```python
async def test_rag_pipeline_complete_flow():
    """Test complete RAG pipeline from query to context"""
    # Given
    query = "What chest exercises should I do?"
    user_id = "test-user-123"

    # When
    context = await rag_pipeline(query, user_id)

    # Then
    assert len(context["retrieved_contexts"]) > 0
    assert context["search_strategy"] in ["semantic", "hybrid"]
    assert all(c["relevance_score"] > 0.5 for c in context["retrieved_contexts"])
```

#### Test: `test_rag_pipeline_user_isolation`
```python
async def test_rag_pipeline_user_isolation():
    """Test RAG pipeline returns only user-specific content"""
    # Given
    user1_id = "user-1"
    user2_id = "user-2"
    query = "my workouts"

    # When
    context1 = await rag_pipeline(query, user1_id)
    context2 = await rag_pipeline(query, user2_id)

    # Then
    # Verify no content overlap between users
    content1_ids = {c["id"] for c in context1["retrieved_contexts"]}
    content2_ids = {c["id"] for c in context2["retrieved_contexts"]}
    assert content1_ids.isdisjoint(content2_ids)
```

## Integration Test Specifications

### 1. Database Integration Tests

#### Test: `test_pgvector_similarity_search`
```python
@pytest.mark.integration
async def test_pgvector_similarity_search():
    """Test pgvector similarity search with real database"""
    # Given
    async with get_db_connection() as conn:
        embedding = generate_embedding("bench press workout")

        # When
        results = await conn.fetch("""
            SELECT content, 1 - (embedding <=> $1) as similarity
            FROM user_context_embeddings
            WHERE 1 - (embedding <=> $1) > 0.7
            ORDER BY similarity DESC
            LIMIT 5
        """, embedding)

        # Then
        assert len(results) > 0
        assert all(r["similarity"] > 0.7 for r in results)
```

#### Test: `test_embedding_storage_and_retrieval`
```python
@pytest.mark.integration
async def test_embedding_storage_and_retrieval():
    """Test storing and retrieving embeddings from database"""
    # Given
    content = "Test workout content"
    embedding = generate_embedding(content)
    user_id = "test-user"

    # When
    stored_id = await store_embedding(user_id, content, embedding)
    retrieved = await get_embedding(stored_id)

    # Then
    assert retrieved["content"] == content
    assert np.allclose(retrieved["embedding"], embedding, rtol=1e-5)
```

### 2. Cache Integration Tests

#### Test: `test_redis_cache_hit`
```python
@pytest.mark.integration
async def test_redis_cache_hit():
    """Test Redis cache for repeated queries"""
    # Given
    query = "chest workout"
    user_id = "test-user"

    # When
    result1 = await cached_search(query, user_id)
    result2 = await cached_search(query, user_id)

    # Then
    assert result1 == result2
    assert await get_cache_hits() == 1
```

### 3. External API Integration Tests

#### Test: `test_openai_fallback_integration`
```python
@pytest.mark.integration
async def test_openai_fallback_integration():
    """Test OpenAI API fallback when primary model fails"""
    # Given
    disable_sentence_transformers()
    text = "Test content"

    # When
    embedding = await generate_embedding_with_fallback(text)

    # Then
    assert embedding["model"] == "text-embedding-3-small"
    assert len(embedding["vector"]) == 1536
```

## Performance Test Specifications

### 1. Latency Tests

#### Test: `test_embedding_generation_latency`
```python
@pytest.mark.performance
def test_embedding_generation_latency():
    """Test embedding generation meets latency requirements"""
    # Given
    text = "Sample workout description"
    max_latency_ms = 100

    # When
    start = time.time()
    embedding = generate_embedding(text)
    latency_ms = (time.time() - start) * 1000

    # Then
    assert latency_ms < max_latency_ms
```

#### Test: `test_search_latency_under_load`
```python
@pytest.mark.performance
async def test_search_latency_under_load():
    """Test search latency with concurrent requests"""
    # Given
    concurrent_requests = 100
    max_p95_latency_ms = 200

    # When
    latencies = await run_concurrent_searches(concurrent_requests)

    # Then
    p95_latency = np.percentile(latencies, 95)
    assert p95_latency < max_p95_latency_ms
```

### 2. Throughput Tests

#### Test: `test_embedding_throughput`
```python
@pytest.mark.performance
def test_embedding_throughput():
    """Test system can handle required embedding throughput"""
    # Given
    target_embeddings_per_hour = 10000
    test_duration_seconds = 60

    # When
    count = generate_embeddings_for_duration(test_duration_seconds)

    # Then
    rate_per_hour = (count / test_duration_seconds) * 3600
    assert rate_per_hour >= target_embeddings_per_hour
```

### 3. Memory Usage Tests

#### Test: `test_memory_usage_under_load`
```python
@pytest.mark.performance
def test_memory_usage_under_load():
    """Test memory usage stays within limits"""
    # Given
    max_memory_mb = 2048
    load_duration_seconds = 300

    # When
    peak_memory = monitor_memory_during_load(load_duration_seconds)

    # Then
    assert peak_memory < max_memory_mb
```

## End-to-End Test Specifications

### Test: `test_e2e_user_query_to_coaching_context`
```python
@pytest.mark.e2e
async def test_e2e_user_query_to_coaching_context():
    """Test complete flow from user query to coaching context"""
    # Given
    user_id = create_test_user()
    add_workout_history(user_id, sample_workouts)
    query = "How can I improve my bench press?"

    # When
    # 1. Generate query embedding
    # 2. Perform hybrid search
    # 3. Re-rank results
    # 4. Return context
    context = await get_coaching_context(query, user_id)

    # Then
    assert len(context["sources"]) > 0
    assert any("bench press" in s["content"].lower() for s in context["sources"])
    assert context["total_tokens"] < 4000
```

### Test: `test_e2e_concurrent_users`
```python
@pytest.mark.e2e
async def test_e2e_concurrent_users():
    """Test system handles multiple concurrent users"""
    # Given
    num_users = 50
    users = [create_test_user() for _ in range(num_users)]

    # When
    results = await asyncio.gather(*[
        get_coaching_context("workout advice", user_id)
        for user_id in users
    ])

    # Then
    assert len(results) == num_users
    assert all(r["status"] == "success" for r in results)
```

## Error Handling Tests

### Test: `test_graceful_model_failure`
```python
def test_graceful_model_failure():
    """Test graceful handling when ML model fails"""
    # Given
    corrupt_model_weights()

    # When
    result = generate_embedding_safe("test")

    # Then
    assert result["status"] == "fallback"
    assert result["embedding"] is not None
```

### Test: `test_database_connection_retry`
```python
@pytest.mark.integration
async def test_database_connection_retry():
    """Test automatic retry on database connection failure"""
    # Given
    simulate_connection_failure(failure_count=2)

    # When
    result = await store_embedding_with_retry(...)

    # Then
    assert result["success"] == True
    assert result["retry_count"] == 2
```

## Security Tests

### Test: `test_user_data_isolation`
```python
async def test_user_data_isolation():
    """Test users cannot access other users' data"""
    # Given
    user1 = "user-1"
    user2 = "user-2"

    # When
    with pytest.raises(PermissionError):
        await get_user_embeddings(user1, requesting_user=user2)
```

### Test: `test_sql_injection_prevention`
```python
async def test_sql_injection_prevention():
    """Test SQL injection prevention in search queries"""
    # Given
    malicious_query = "'; DROP TABLE user_context_embeddings; --"

    # When
    result = await search_embeddings(malicious_query, "test-user")

    # Then
    # Should complete without error
    assert result["status"] == "success"
    # Table should still exist
    assert await table_exists("user_context_embeddings")
```

## Test Data Fixtures

```python
@pytest.fixture
def sample_workout_data():
    return {
        "workouts": [
            {"name": "Chest Day", "exercises": ["bench press", "flys"]},
            {"name": "Leg Day", "exercises": ["squats", "lunges"]}
        ]
    }

@pytest.fixture
async def test_database():
    """Provide clean test database for each test"""
    db = await create_test_database()
    yield db
    await cleanup_test_database(db)

@pytest.fixture
def mock_openai_client():
    """Mock OpenAI client for testing"""
    return Mock(spec=OpenAI)
```

## Coverage Requirements

### Minimum Coverage Targets
- Overall: 80%
- Core algorithms: 100%
- API endpoints: 90%
- Error handling: 95%
- Database operations: 85%

### Critical Path Coverage
These paths must have 100% coverage:
1. Embedding generation pipeline
2. Hybrid search algorithm
3. User data isolation
4. Error recovery mechanisms

## Test Execution Strategy

### Local Development
```bash
# Run all tests
pytest tests/

# Run with coverage
pytest --cov=app --cov-report=html tests/

# Run specific category
pytest tests/unit/
pytest tests/integration/
pytest tests/performance/
```

### CI/CD Pipeline
```yaml
test:
  stage: test
  script:
    - pytest tests/unit/ --cov=app
    - pytest tests/integration/ --postgresql=$TEST_DB
    - pytest tests/e2e/ --env=staging
  coverage: '/TOTAL.*\s+(\d+%)$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
```

### Performance Testing
```bash
# Run performance tests
pytest tests/performance/ -m performance

# Load testing
locust -f tests/load/locustfile.py --host=http://localhost:8000
```

## Test Documentation

Each test should include:
1. Clear description of what is being tested
2. Given/When/Then structure
3. Expected vs actual behavior
4. Cleanup requirements

## Success Metrics

### Test Quality
- No flaky tests (< 0.1% failure rate)
- Test execution time < 5 minutes for unit tests
- Clear failure messages

### Test Effectiveness
- Bug detection rate > 90%
- Production incident reduction > 50%
- Code review cycle time reduction > 30%