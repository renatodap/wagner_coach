# AI Coach Memory Enhancement Migration Guide

## Overview
This migration adds a memory enhancement system to the AI coach, allowing it to remember user preferences, extract facts from conversations, and maintain conversation summaries.

## Migration Files

### New Migration
- **File**: `supabase/migrations/20240202_memory_enhancement_system.sql`
- **Purpose**: Adds memory tables and enhanced context function without conflicting with existing functions

### Removed Migration
- **File**: `supabase/migrations/20240201_enhance_rag_context.sql` (REMOVED)
- **Reason**: Attempted to change the return type of existing `get_rag_context_for_user` function, causing conflict

## Key Changes

### 1. New Database Tables

#### `user_memory_facts`
- Stores extracted facts about users from conversations
- Types: preference, goal, constraint, achievement, routine
- Includes confidence scoring and metadata

#### `conversation_summaries`
- Stores AI conversation summaries
- Includes key topics, action items, and sentiment analysis

#### `user_preference_profiles`
- Comprehensive user preferences for personalized coaching
- Includes workout, nutrition, and communication preferences

### 2. New RPC Function

#### `get_enhanced_rag_context(p_user_id UUID)`
- Returns JSON with complete user context including memory
- Does NOT replace the existing `get_rag_context_for_user` function
- Backward compatible - falls back to standard context if memory tables are empty

### 3. TypeScript Updates

The TypeScript code has been updated to:
1. Try the new `get_enhanced_rag_context` function first
2. Fall back to the existing `get_rag_context_for_user` if needed
3. Handle both JSON and TABLE return formats correctly

## Migration Process

### Step 1: Apply the Migration

```bash
# Using Supabase CLI
supabase migration up

# Or apply directly to your database
psql -h your-database-host -U postgres -d your-database -f supabase/migrations/20240202_memory_enhancement_system.sql
```

### Step 2: Verify Migration

Run the test script to verify everything was created correctly:

```bash
psql -h your-database-host -U postgres -d your-database -f scripts/test-migration.sql
```

### Step 3: Test the Enhanced Context

```sql
-- Test with a valid user ID
SELECT * FROM get_enhanced_rag_context('your-user-id-here'::UUID);
```

### Step 4: Deploy TypeScript Changes

The updated TypeScript files will automatically use the enhanced context when available:
- `lib/ai/enhanced-context.ts` - Context builder with memory support
- `lib/ai/memory-extractor.ts` - Extracts facts from conversations
- `lib/ai/context-compressor.ts` - Compresses context for token limits
- `app/api/coach/enhanced/route.ts` - Enhanced coaching endpoint

## Rollback Process

If you need to rollback:

```sql
-- Drop the new function
DROP FUNCTION IF EXISTS get_enhanced_rag_context(UUID);

-- Drop the new tables (WARNING: This will delete all stored memory data)
DROP TABLE IF EXISTS conversation_summaries CASCADE;
DROP TABLE IF EXISTS user_preference_profiles CASCADE;
DROP TABLE IF EXISTS user_memory_facts CASCADE;

-- Drop helper functions
DROP FUNCTION IF EXISTS cleanup_expired_memory_facts();
DROP FUNCTION IF EXISTS merge_duplicate_facts(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## Testing Checklist

- [ ] Migration applies without errors
- [ ] All tables are created
- [ ] Indexes are created
- [ ] RLS policies are in place
- [ ] `get_enhanced_rag_context` function works
- [ ] Original `get_rag_context_for_user` still works
- [ ] TypeScript code compiles
- [ ] Enhanced coach endpoint works
- [ ] Memory extraction works from conversations

## Benefits of This Approach

1. **No Breaking Changes**: Existing `get_rag_context_for_user` function remains unchanged
2. **Gradual Adoption**: Can test the enhanced function with select users first
3. **Backward Compatible**: Falls back gracefully if memory tables are empty
4. **Performance**: Uses indexes and optimized queries for fast retrieval
5. **Security**: RLS policies ensure users can only access their own data

## Future Enhancements

1. Add automatic fact expiration based on relevance
2. Implement fact merging to reduce duplicates
3. Add embeddings for semantic fact retrieval
4. Create analytics dashboard for memory usage
5. Add privacy controls for users to manage their memory

## Troubleshooting

### Error: "cannot change return type of existing function"
- **Cause**: Trying to modify existing function signature
- **Solution**: Use the new `get_enhanced_rag_context` function instead

### Error: "relation does not exist"
- **Cause**: Tables not created yet
- **Solution**: Run the migration file first

### Performance Issues
- **Check**: Indexes are created
- **Solution**: Run `VACUUM ANALYZE` on the new tables
- **Consider**: Limiting memory facts per user with cleanup job