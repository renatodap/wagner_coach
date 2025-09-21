# AI Coach Feature Design

## Overview
The AI Coach feature provides personalized, context-aware fitness coaching through a conversational interface. It leverages the user's complete workout history, goals, and progress data to deliver intelligent, actionable guidance.

## Core Components

### 1. Chat Interface
- **Location**: `/coach` route with dedicated UI
- **Design**: Full-screen mobile-optimized chat with streaming responses
- **Theme**: Iron Discipline design system (black/orange)
- **Navigation**: New "Coach" tab in bottom navigation

### 2. Vector Database Integration
- **Technology**: PostgreSQL with pgvector extension
- **Purpose**: Semantic search and memory retrieval
- **Embedding Model**: Google Embeddings API (768 dimensions)
- **Storage**: User context, conversations, workout summaries

### 3. RAG (Retrieval-Augmented Generation) System
- **Context Sources**:
  - Workout completions and performance data
  - User goals and preferences
  - Exercise history and personal records
  - Previous coaching conversations
- **Retrieval Method**: Cosine similarity search on embeddings
- **Generation**: OpenAI GPT-4 with streaming responses

### 4. Real-time Streaming
- **Implementation**: Vercel AI SDK with ReadableStream
- **UI Updates**: Progressive message rendering
- **Error Handling**: Graceful fallbacks and retry logic

## User Flows

### First-Time User Flow
1. User clicks "Coach" tab in navigation
2. Welcome message with introduction
3. Quick setup questions about goals and experience
4. Initial context generation from existing data
5. Begin personalized coaching conversation

### Returning User Flow
1. User opens coach interface
2. Previous conversation history loads
3. Contextual greeting based on recent activity
4. Quick action buttons for common requests
5. Continuous conversation with full context

### Workout-Specific Coaching
1. Access coach during active workout
2. Real-time guidance for current exercise
3. Form tips and modification suggestions
4. Post-workout analysis and recovery advice

## Data Architecture

### New Database Tables
```sql
ai_conversations
- id (uuid, primary key)
- user_id (uuid, foreign key)
- messages (jsonb)
- embedding (vector(768))
- created_at (timestamp)
- updated_at (timestamp)

user_context_embeddings
- id (uuid, primary key)
- user_id (uuid, foreign key)
- content_type (text)
- content (text)
- metadata (jsonb)
- embedding (vector(768))
- created_at (timestamp)
```

### Modified Tables
```sql
workout_completions
- ADD COLUMN embedding vector(768)

profiles
- ADD COLUMN goals_embedding vector(768)
```

## API Endpoints

### `/api/coach/route.ts`
- **Method**: POST
- **Purpose**: Handle chat messages with RAG
- **Request**: { message: string, conversationId?: string }
- **Response**: Streaming AI response with context

### `/api/embeddings/generate/route.ts`
- **Method**: POST
- **Purpose**: Generate embeddings for content
- **Request**: { content: string, type: string }
- **Response**: { embedding: number[] }

### `/api/embeddings/search/route.ts`
- **Method**: POST
- **Purpose**: Semantic search in user context
- **Request**: { query: string, limit: number }
- **Response**: { results: ContextResult[] }

### `/api/context/route.ts`
- **Method**: GET
- **Purpose**: Retrieve user context for RAG
- **Response**: { workouts: [], goals: {}, progress: {} }

## UI Components

### CoachClient Component
- Main chat interface container
- Message history management
- Streaming response handling
- Quick action buttons

### ChatInterface Component
- Message display area
- Input field with send button
- Typing indicators
- Auto-scroll behavior

### MessageBubble Component
- User/AI message differentiation
- Timestamp display
- Copy/share functionality
- Markdown rendering support

### QuickActions Component
- Common coaching requests
- "Analyze last workout"
- "Plan next session"
- "Check progress"

### ContextCards Component
- Embedded workout data
- Progress visualizations
- Exercise recommendations
- Goal tracking displays

## AI Coaching Capabilities

### 1. Workout Analysis
- Review session performance
- Identify strength/weakness patterns
- Suggest technique improvements
- Track progression trends

### 2. Personalized Programming
- Modify workouts based on goals
- Adjust volume and intensity
- Progressive overload planning
- Deload week recommendations

### 3. Motivation & Accountability
- Consistency tracking
- Milestone celebrations
- Encouragement during plateaus
- Goal reminder system

### 4. Form & Technique Guidance
- Exercise-specific cues
- Common mistake corrections
- Safety considerations
- Alternative exercise suggestions

### 5. Recovery Optimization
- Rest day recommendations
- Active recovery suggestions
- Sleep and nutrition basics
- Injury prevention tips

## Technical Implementation

### Dependencies
```json
{
  "ai": "^3.0.0",
  "@google/generative-ai": "^0.1.0",
  "openai": "^4.0.0",
  "@supabase/supabase-js": "^2.57.4"
}
```

### Environment Variables
```env
OPENAI_API_KEY=existing_key
GOOGLE_API_KEY=new_required_key
```

### Performance Considerations
- Embedding generation: Batch processing
- Vector search: Indexed queries
- Response streaming: Chunked transfers
- Cache strategy: Recent context in memory

## Security & Privacy

### Data Protection
- User-isolated conversations via RLS
- No PII in embeddings
- Encrypted message storage
- Audit logging for AI interactions

### Rate Limiting
- 100 messages per user per day
- 10 concurrent conversations max
- Cooldown periods for abuse prevention

### Content Filtering
- Inappropriate content detection
- Medical advice disclaimers
- Emergency situation handling

## Success Metrics

### Usage Metrics
- Daily active coaching users
- Average messages per session
- Quick action utilization
- Feature retention rate

### Quality Metrics
- Response relevance score
- User satisfaction ratings
- Context retrieval accuracy
- Coaching effectiveness tracking

### Performance Metrics
- Response generation time
- Embedding search latency
- Streaming smoothness
- Error rate monitoring

## Mobile Optimization

### Touch Interactions
- Large tap targets (44x44px min)
- Swipe gestures for navigation
- Pull-to-refresh conversation
- Voice input support

### Responsive Design
- Adaptive layout breakpoints
- Keyboard-aware input positioning
- Landscape orientation support
- Offline message queuing

## Testing Strategy

### Unit Tests
- Embedding generation functions
- Context retrieval logic
- Message formatting utilities
- RAG pipeline components

### Integration Tests
- End-to-end chat flow
- Database operations
- API endpoint responses
- Streaming functionality

### E2E Tests
- Complete user journey
- Multi-turn conversations
- Context switching scenarios
- Error recovery paths

## Rollout Plan

### Phase 1: Core Implementation
- Basic chat interface
- Simple RAG system
- Text-only responses
- Manual testing

### Phase 2: Enhancement
- Rich context cards
- Voice input/output
- Advanced analytics
- A/B testing

### Phase 3: Scale
- Multi-model support
- Group coaching
- Community features
- Premium tiers

## Risk Mitigation

### Technical Risks
- API rate limits: Implement queuing
- Embedding costs: Batch processing
- Latency issues: Edge caching
- Model hallucinations: Fact verification

### User Experience Risks
- Incorrect advice: Medical disclaimers
- Over-reliance: Human coach promotion
- Privacy concerns: Clear data policies
- Feature confusion: Onboarding flow

## Future Enhancements

### Near-term
- Exercise video integration
- Nutrition tracking connection
- Wearable device sync
- Progress photo analysis

### Long-term
- Computer vision form checking
- Predictive injury prevention
- Social coaching features
- Custom workout generation