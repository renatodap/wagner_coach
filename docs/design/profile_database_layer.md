# Profile Database Layer Design

## User Story
As a developer, I need a robust and secure database schema to store detailed user profiles and their multiple fitness goals, ensuring data is private and only accessible by its owner.

## Acceptance Criteria

1. **Extended Profiles Table**
   - The `profiles` table is extended with all specified columns:
     - `about_me` (text): User's personal bio and background
     - `experience_level` (enum): beginner/intermediate/advanced
     - `fitness_goals` (text[]): Array of fitness objectives
     - `motivation_factors` (text[]): What drives the user
     - `preferred_activities` (text[]): Liked exercise types
     - `physical_limitations` (text[]): Injuries or constraints
     - `available_equipment` (text[]): Equipment access
     - `training_frequency` (text): Sessions per week
     - `session_duration` (text): Typical workout length
     - `dietary_preferences` (text[]): Nutrition preferences
     - `height` (integer): Height in cm
     - `weight` (integer): Weight in kg
     - `timezone` (text): User's timezone
     - `notification_preferences` (jsonb): Push/email settings

2. **New Tables Created**
   - `user_goals` table:
     - `id` (uuid, primary key)
     - `user_id` (uuid, FK to auth.users)
     - `goal_type` (text): strength/weight_loss/muscle_gain/etc
     - `goal_description` (text): Detailed goal description
     - `target_value` (numeric): Measurable target
     - `target_unit` (text): kg/lbs/reps/etc
     - `target_date` (date): Goal deadline
     - `priority` (integer): 1-5 scale
     - `is_active` (boolean): Active/archived status
     - `created_at` (timestamp)
     - `updated_at` (timestamp)

   - `profile_embeddings` table:
     - `id` (uuid, primary key)
     - `user_id` (uuid, FK to auth.users)
     - `content_hash` (text): Hash of source text
     - `embedding` (vector(1536)): OpenAI embeddings
     - `metadata` (jsonb): Source field info
     - `created_at` (timestamp)

   - `goal_embeddings` table:
     - `id` (uuid, primary key)
     - `goal_id` (uuid, FK to user_goals)
     - `user_id` (uuid, FK to auth.users)
     - `content_hash` (text): Hash of source text
     - `embedding` (vector(1536)): OpenAI embeddings
     - `metadata` (jsonb): Source field info
     - `created_at` (timestamp)

3. **Row Level Security (RLS) Policies**
   - Strict RLS policies are implemented and enabled for all four tables
   - Users can only perform CRUD operations on their own data
   - Cross-user access attempts fail with permission errors

4. **Migration File**
   - A deterministic Supabase migration file is created
   - The migration applies all schema changes atomically
   - Rollback capability is included

## Technical Approach

### Schema Design Decisions
1. **Use of Arrays vs Relations**: Arrays used for simple lists (equipment, preferences) to avoid over-normalization
2. **JSONB for Flexible Data**: Notification preferences use JSONB for future extensibility
3. **Enums for Constraints**: Experience level uses enum to ensure data validity
4. **Embedding Vectors**: Using vector(1536) to match OpenAI's embedding dimensions
5. **Content Hashing**: Prevents duplicate embeddings and enables change detection

### Security Model
1. **RLS Policies Structure**:
   ```sql
   -- Example policy structure
   CREATE POLICY "Users can view own profile"
   ON profiles FOR SELECT
   USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile"
   ON profiles FOR UPDATE
   USING (auth.uid() = id)
   WITH CHECK (auth.uid() = id);
   ```

2. **Data Isolation**: Each user's data is completely isolated from other users
3. **Service Role Access**: Only service role can bypass RLS for admin operations

### Performance Considerations
1. **Indexes**:
   - B-tree indexes on foreign keys
   - GiST index on embedding vectors for similarity search
   - Composite indexes for common query patterns

2. **Partitioning Strategy**: Consider partitioning embeddings tables if they grow large

### Data Integrity
1. **Cascading Deletes**: When a user is deleted, all related data is removed
2. **Check Constraints**: Ensure target_value is positive, dates are future, etc.
3. **Triggers**: Auto-update `updated_at` timestamps

## Dependencies
- Supabase with pgvector extension enabled
- PostgreSQL 14+ for vector support
- Supabase CLI for migration management

## Success Metrics
- All RLS policies prevent cross-user data access
- Migration applies cleanly to development and production
- Query performance remains under 100ms for profile fetches
- Vector similarity searches complete within 200ms