import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe('Database Schema Validation', () => {
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  describe('profiles table extensions', () => {
    test('should have all new columns with correct types', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(0);

      expect(error).toBeNull();

      // These columns should exist
      const expectedColumns = [
        'about_me',
        'experience_level',
        'fitness_goals',
        'motivation_factors',
        'preferred_activities',
        'physical_limitations',
        'available_equipment',
        'training_frequency',
        'session_duration',
        'dietary_preferences',
        'height',
        'weight',
        'timezone',
        'notification_preferences'
      ];

      // This will fail until migration is applied
      const { data: tableInfo } = await supabase
        .rpc('get_table_columns', { table_name: 'profiles' });

      expectedColumns.forEach(column => {
        expect(tableInfo).toContainEqual(
          expect.objectContaining({ column_name: column })
        );
      });
    });

    test('should maintain backwards compatibility with existing columns', async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, age, gender, created_at, updated_at')
        .limit(1);

      expect(error).toBeNull();
    });

    test('should have proper default values for new columns', async () => {
      const { data: defaultValues } = await supabase
        .rpc('get_column_defaults', { table_name: 'profiles' });

      expect(defaultValues).toBeDefined();
    });

    test('should enforce enum constraints on experience_level', async () => {
      const validLevels = ['beginner', 'intermediate', 'advanced'];

      // Try to insert invalid experience level
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: 'test-user-id',
          experience_level: 'invalid-level' as any
        });

      expect(error).toBeDefined();
      expect(error?.code).toBe('23514'); // Check constraint violation
    });
  });

  describe('user_goals table', () => {
    test('should exist with all required columns', async () => {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .limit(0);

      expect(error).toBeNull();

      const expectedColumns = [
        'id',
        'user_id',
        'goal_type',
        'goal_description',
        'target_value',
        'target_unit',
        'target_date',
        'priority',
        'is_active',
        'created_at',
        'updated_at'
      ];

      const { data: tableInfo } = await supabase
        .rpc('get_table_columns', { table_name: 'user_goals' });

      expectedColumns.forEach(column => {
        expect(tableInfo).toContainEqual(
          expect.objectContaining({ column_name: column })
        );
      });
    });

    test('should have proper foreign key to auth.users', async () => {
      const { data: constraints } = await supabase
        .rpc('get_table_constraints', { table_name: 'user_goals' });

      expect(constraints).toContainEqual(
        expect.objectContaining({
          constraint_type: 'FOREIGN KEY',
          column_name: 'user_id',
          foreign_table_name: 'users',
          foreign_table_schema: 'auth'
        })
      );
    });

    test('should enforce check constraints on target_value (positive only)', async () => {
      const { error } = await supabase
        .from('user_goals')
        .insert({
          id: crypto.randomUUID(),
          user_id: 'test-user',
          goal_type: 'weight_loss',
          goal_description: 'Test goal',
          target_value: -10, // Invalid negative value
          priority: 3,
          is_active: true
        });

      expect(error).toBeDefined();
      expect(error?.code).toBe('23514'); // Check constraint violation
    });

    test('should enforce target_date is in the future', async () => {
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      const { error } = await supabase
        .from('user_goals')
        .insert({
          id: crypto.randomUUID(),
          user_id: 'test-user',
          goal_type: 'muscle_gain',
          goal_description: 'Test goal',
          target_date: pastDate.toISOString(),
          priority: 3,
          is_active: true
        });

      expect(error).toBeDefined();
      expect(error?.code).toBe('23514'); // Check constraint violation
    });

    test('should have unique constraint on id', async () => {
      const duplicateId = crypto.randomUUID();

      await supabase.from('user_goals').insert({
        id: duplicateId,
        user_id: 'test-user-1',
        goal_type: 'strength',
        goal_description: 'Goal 1',
        priority: 1,
        is_active: true
      });

      const { error } = await supabase.from('user_goals').insert({
        id: duplicateId, // Same ID
        user_id: 'test-user-2',
        goal_type: 'endurance',
        goal_description: 'Goal 2',
        priority: 2,
        is_active: true
      });

      expect(error).toBeDefined();
      expect(error?.code).toBe('23505'); // Unique violation
    });

    test('should cascade delete when user is removed', async () => {
      // This test requires auth.users manipulation, which needs service role
      const userId = crypto.randomUUID();

      // Create user and goal
      await supabase.auth.admin.createUser({
        email: `test-${userId}@example.com`,
        password: 'TestPassword123!'
      });

      const { data: goal } = await supabase
        .from('user_goals')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          goal_type: 'flexibility',
          goal_description: 'Test cascade delete',
          priority: 1,
          is_active: true
        })
        .select()
        .single();

      // Delete user
      await supabase.auth.admin.deleteUser(userId);

      // Check goal is gone
      const { data: deletedGoal } = await supabase
        .from('user_goals')
        .select('*')
        .eq('id', goal!.id)
        .single();

      expect(deletedGoal).toBeNull();
    });
  });

  describe('profile_embeddings table', () => {
    test('should exist with vector(1536) column', async () => {
      const { data, error } = await supabase
        .from('profile_embeddings')
        .select('*')
        .limit(0);

      expect(error).toBeNull();

      const { data: columnInfo } = await supabase
        .rpc('get_column_info', {
          table_name: 'profile_embeddings',
          column_name: 'embedding'
        });

      expect(columnInfo).toMatchObject({
        data_type: 'vector',
        dimension: 1536
      });
    });

    test('should have proper foreign key to auth.users', async () => {
      const { data: constraints } = await supabase
        .rpc('get_table_constraints', { table_name: 'profile_embeddings' });

      expect(constraints).toContainEqual(
        expect.objectContaining({
          constraint_type: 'FOREIGN KEY',
          column_name: 'user_id',
          foreign_table_name: 'users',
          foreign_table_schema: 'auth'
        })
      );
    });

    test('should have unique constraint on user_id + content_hash', async () => {
      const { data: constraints } = await supabase
        .rpc('get_table_constraints', { table_name: 'profile_embeddings' });

      expect(constraints).toContainEqual(
        expect.objectContaining({
          constraint_type: 'UNIQUE',
          columns: ['user_id', 'content_hash']
        })
      );
    });

    test('should have GiST index on embedding column', async () => {
      const { data: indexes } = await supabase
        .rpc('get_table_indexes', { table_name: 'profile_embeddings' });

      expect(indexes).toContainEqual(
        expect.objectContaining({
          index_type: 'gist',
          column_name: 'embedding'
        })
      );
    });
  });

  describe('goal_embeddings table', () => {
    test('should exist with vector(1536) column', async () => {
      const { data, error } = await supabase
        .from('goal_embeddings')
        .select('*')
        .limit(0);

      expect(error).toBeNull();

      const { data: columnInfo } = await supabase
        .rpc('get_column_info', {
          table_name: 'goal_embeddings',
          column_name: 'embedding'
        });

      expect(columnInfo).toMatchObject({
        data_type: 'vector',
        dimension: 1536
      });
    });

    test('should have proper foreign keys to user_goals and auth.users', async () => {
      const { data: constraints } = await supabase
        .rpc('get_table_constraints', { table_name: 'goal_embeddings' });

      expect(constraints).toContainEqual(
        expect.objectContaining({
          constraint_type: 'FOREIGN KEY',
          column_name: 'goal_id',
          foreign_table_name: 'user_goals'
        })
      );

      expect(constraints).toContainEqual(
        expect.objectContaining({
          constraint_type: 'FOREIGN KEY',
          column_name: 'user_id',
          foreign_table_name: 'users',
          foreign_table_schema: 'auth'
        })
      );
    });

    test('should cascade delete when goal is removed', async () => {
      const userId = crypto.randomUUID();
      const goalId = crypto.randomUUID();

      // Create test user
      await supabase.auth.admin.createUser({
        email: `test-${userId}@example.com`,
        password: 'TestPassword123!'
      });

      // Create goal
      await supabase.from('user_goals').insert({
        id: goalId,
        user_id: userId,
        goal_type: 'rehabilitation',
        goal_description: 'Recovery goal',
        priority: 1,
        is_active: true
      });

      // Create embedding for goal
      const embeddingId = crypto.randomUUID();
      await supabase.from('goal_embeddings').insert({
        id: embeddingId,
        goal_id: goalId,
        user_id: userId,
        content_hash: 'test-hash',
        embedding: new Array(1536).fill(0.1),
        metadata: { source_field: 'goal_description' }
      });

      // Delete goal
      await supabase.from('user_goals').delete().eq('id', goalId);

      // Check embedding is gone
      const { data: deletedEmbedding } = await supabase
        .from('goal_embeddings')
        .select('*')
        .eq('id', embeddingId)
        .single();

      expect(deletedEmbedding).toBeNull();

      // Cleanup
      await supabase.auth.admin.deleteUser(userId);
    });

    test('should have GiST index on embedding column', async () => {
      const { data: indexes } = await supabase
        .rpc('get_table_indexes', { table_name: 'goal_embeddings' });

      expect(indexes).toContainEqual(
        expect.objectContaining({
          index_type: 'gist',
          column_name: 'embedding'
        })
      );
    });
  });
});