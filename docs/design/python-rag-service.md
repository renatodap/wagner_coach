# Python RAG Service Design Document

## Overview
Enhanced Retrieval-Augmented Generation (RAG) service using Python to provide advanced ML capabilities for the Wagner Coach fitness application.

## Goals
1. Improve embedding quality using sentence-transformers
2. Implement hybrid search (keyword + semantic)
3. Add re-ranking capabilities for better relevance
4. Provide foundation for local model hosting
5. Maintain backward compatibility with existing TypeScript implementation

## Architecture

### System Components

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│  Python RAG API  │────▶│   PostgreSQL    │
│  (TypeScript)   │     │    (FastAPI)     │     │   (pgvector)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         │                       │                         ▲
         │                       ▼                         │
         │              ┌──────────────────┐              │
         └─────────────▶│   OpenAI API     │              │
                        └──────────────────┘              │
                                 │                         │
                                 ▼                         │
                        ┌──────────────────┐              │
                        │  Sentence Trans. │──────────────┘
                        └──────────────────┘
```

### Service Endpoints

#### 1. Enhanced Embeddings Generation
```python
POST /api/v1/embeddings/generate
{
    "text": string,
    "user_id": string,
    "content_type": "workout" | "goal" | "conversation" | "progress",
    "metadata": object
}
Response: {
    "embedding": float[],
    "dimension": int,
    "model": string
}
```

#### 2. Hybrid Search
```python
POST /api/v1/search/hybrid
{
    "query": string,
    "user_id": string,
    "search_type": "semantic" | "keyword" | "hybrid",
    "limit": int,
    "threshold": float
}
Response: {
    "results": [{
        "content": string,
        "score": float,
        "type": string,
        "metadata": object
    }]
}
```

#### 3. Context Re-ranking
```python
POST /api/v1/rerank
{
    "query": string,
    "candidates": [string],
    "user_id": string,
    "top_k": int
}
Response: {
    "reranked": [{
        "content": string,
        "relevance_score": float,
        "original_rank": int
    }]
}
```

#### 4. RAG Pipeline
```python
POST /api/v1/rag/query
{
    "query": string,
    "user_id": string,
    "include_context": ["workouts", "nutrition", "goals", "activities"],
    "max_context_items": int
}
Response: {
    "context": [{
        "source": string,
        "content": string,
        "relevance": float
    }],
    "embeddings_used": string[],
    "search_strategy": string
}
```

## Data Models

### Embedding Model
```python
class Embedding(BaseModel):
    id: str
    user_id: str
    content: str
    content_type: str
    embedding_vector: List[float]
    model_name: str
    dimension: int
    metadata: Dict[str, Any]
    created_at: datetime
```

### Search Result Model
```python
class SearchResult(BaseModel):
    content: str
    content_type: str
    relevance_score: float
    metadata: Dict[str, Any]
    source: str
    timestamp: datetime
```

### RAG Context Model
```python
class RAGContext(BaseModel):
    user_id: str
    query: str
    retrieved_contexts: List[SearchResult]
    search_strategy: str
    total_tokens: int
    processing_time_ms: float
```

## Technical Implementation

### Embedding Models
- **Primary**: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)
- **Fallback**: OpenAI text-embedding-3-small (1536 dimensions)
- **Domain-specific**: Fine-tuned model on fitness terminology

### Search Strategies

#### Semantic Search
- Cosine similarity on embedding vectors
- IVFFlat index for performance
- Configurable similarity threshold

#### Keyword Search
- PostgreSQL full-text search
- TSVector/TSQuery for efficient text matching
- Fitness-specific tokenization

#### Hybrid Search Algorithm
```python
def hybrid_search(query, alpha=0.5):
    semantic_results = semantic_search(query)
    keyword_results = keyword_search(query)

    # Normalize scores to [0, 1]
    semantic_scores = normalize_scores(semantic_results)
    keyword_scores = normalize_scores(keyword_results)

    # Combine with weighted average
    combined = {}
    for doc_id, score in semantic_scores.items():
        combined[doc_id] = alpha * score

    for doc_id, score in keyword_scores.items():
        if doc_id in combined:
            combined[doc_id] += (1 - alpha) * score
        else:
            combined[doc_id] = (1 - alpha) * score

    return sorted(combined.items(), key=lambda x: x[1], reverse=True)
```

### Re-ranking Strategy
- Cross-encoder model for query-document relevance
- ms-marco-MiniLM-L-6-v2 for fitness domain
- Batch processing for efficiency

## Performance Requirements

### Latency
- Embedding generation: < 100ms
- Hybrid search: < 200ms
- Re-ranking: < 150ms
- Complete RAG pipeline: < 500ms

### Throughput
- 100 concurrent requests
- 10,000 embeddings/hour
- Async processing with queue

### Caching Strategy
- Redis for embedding cache (TTL: 1 hour)
- LRU cache for frequent queries
- Batch embedding generation

## Security & Privacy

### Data Protection
- User ID validation on all endpoints
- Row-level security via Supabase
- No PII in embeddings

### API Security
- JWT authentication
- Rate limiting per user
- API key for service-to-service

## Monitoring & Observability

### Metrics
- Embedding generation latency
- Search accuracy (click-through rate)
- Cache hit rate
- Model inference time

### Logging
- Structured logging with correlation IDs
- Query performance tracking
- Error tracking with Sentry

### Health Checks
```python
GET /health
{
    "status": "healthy",
    "models_loaded": ["all-MiniLM-L6-v2"],
    "database": "connected",
    "cache": "connected",
    "uptime_seconds": 3600
}
```

## Migration Strategy

### Phase 1: Parallel Operation
1. Deploy Python service alongside existing TypeScript
2. Route 10% of traffic for A/B testing
3. Monitor performance and accuracy

### Phase 2: Gradual Migration
1. Increase traffic to 50%
2. Migrate embedding generation
3. Add hybrid search

### Phase 3: Full Migration
1. 100% traffic to Python service
2. TypeScript becomes thin client
3. Deprecate old embedding system

## Dependencies

### Python Libraries
```python
# Core
fastapi==0.104.1
pydantic==2.5.0
uvicorn==0.24.0

# ML/AI
sentence-transformers==2.2.2
torch==2.1.0
transformers==4.35.0
openai==1.3.0

# Database
asyncpg==0.29.0
pgvector==0.2.3
sqlalchemy==2.0.23

# Caching
redis==5.0.1
aiocache==0.12.2

# Monitoring
prometheus-client==0.19.0
sentry-sdk==1.38.0
```

## Testing Strategy

### Unit Tests
- Embedding generation accuracy
- Search result relevance
- Re-ranking correctness

### Integration Tests
- Database connectivity
- Cache operations
- API endpoint validation

### Performance Tests
- Load testing with k6
- Latency benchmarks
- Memory usage profiling

### Coverage Requirements
- Minimum 80% code coverage
- 100% coverage for core algorithms
- E2E tests for critical paths

## Success Criteria

### Quantitative
- 30% improvement in search relevance
- 50% reduction in embedding costs
- < 500ms P95 latency
- 99.9% uptime

### Qualitative
- Better context retrieval for coaching
- More accurate workout recommendations
- Improved nutrition insights
- Seamless migration experience

## Risks & Mitigations

### Risk 1: Model Performance
**Mitigation**: Fallback to OpenAI embeddings, extensive testing

### Risk 2: Latency Increase
**Mitigation**: Aggressive caching, async processing, CDN

### Risk 3: Migration Complexity
**Mitigation**: Gradual rollout, feature flags, rollback plan

### Risk 4: Cost Overrun
**Mitigation**: Auto-scaling limits, usage monitoring, alerts

## Future Enhancements

### Short-term (3 months)
- Fine-tune embeddings on fitness data
- Add query expansion
- Implement feedback loop

### Medium-term (6 months)
- Local model hosting (Ollama)
- Multi-modal embeddings (images)
- Personalized ranking

### Long-term (12 months)
- Custom fitness LLM
- Real-time learning
- Federated learning for privacy