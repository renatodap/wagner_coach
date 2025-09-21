import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

describe('Data Integrity Constraints', () => {
  const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

  describe('Cascading deletes', () => {
    test('deleting user removes all related profile data', async () => {
      const userId = crypto.randomUUID();
      const email = `test-cascade-${Date.now()}@example.com`;

      // Create user
      await supabase.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        user_metadata: { id: userId }
      });

      // Create profile data
      await supabase.from('profiles').insert({
        id: userId,
        email,
        full_name: 'Test User',
        about_me: 'Test profile',
        experience_level: 'beginner',
        fitness_goals: ['weight_loss', 'strength'],
        available_equipment: ['dumbbells', 'resistance_bands']
      });

      // Create goals
      const goalIds = [];
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase
          .from('user_goals')
          .insert({
            user_id: userId,
            goal_type: 'strength',
            goal_description: `Goal ${i + 1}`,
            priority: i + 1,
            is_active: true
          })
          .select('id')
          .single();
        goalIds.push(data!.id);
      }

      // Create embeddings
      const embedding = new Array(1536).fill(0.1);
      await supabase.from('profile_embeddings').insert({
        user_id: userId,
        content_hash: 'profile-hash',
        embedding,
        metadata: {
          source_field: 'about_me',
          generated_at: new Date().toISOString(),
          model: 'text-embedding-ada-002'
        }
      });

      await supabase.from('goal_embeddings').insert({
        goal_id: goalIds[0],
        user_id: userId,
        content_hash: 'goal-hash',
        embedding,
        metadata: {
          source_field: 'goal_description',
          generated_at: new Date().toISOString(),
          model: 'text-embedding-ada-002'
        }
      });

      // Delete the user
      await supabase.auth.admin.deleteUser(userId);

      // Verify all related data is deleted
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      expect(profile).toBeNull();

      const { data: goals } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId);
      expect(goals).toEqual([]);

      const { data: profileEmbeddings } = await supabase
        .from('profile_embeddings')
        .select('*')
        .eq('user_id', userId);
      expect(profileEmbeddings).toEqual([]);

      const { data: goalEmbeddings } = await supabase
        .from('goal_embeddings')
        .select('*')
        .eq('user_id', userId);
      expect(goalEmbeddings).toEqual([]);
    });

    test('deleting goal removes related embeddings', async () => {
      const userId = crypto.randomUUID();
      const goalId = crypto.randomUUID();
      const email = `test-goal-cascade-${Date.now()}@example.com`;

      // Create user
      await supabase.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        user_metadata: { id: userId }
      });

      // Create goal
      await supabase.from('user_goals').insert({
        id: goalId,
        user_id: userId,
        goal_type: 'endurance',
        goal_description: 'Run a marathon',
        target_value: 42.195,
        target_unit: 'km',
        priority: 1,
        is_active: true
      });

      // Create multiple embeddings for the goal
      const embedding = new Array(1536).fill(0.2);
      const embeddingIds = [];
      for (let i = 0; i < 3; i++) {
        const { data } = await supabase
          .from('goal_embeddings')
          .insert({
            goal_id: goalId,
            user_id: userId,
            content_hash: `hash-${i}`,
            embedding,
            metadata: {
              source_field: 'goal_description',
              generated_at: new Date().toISOString(),
              model: 'text-embedding-ada-002'
            }
          })
          .select('id')
          .single();
        embeddingIds.push(data!.id);
      }

      // Delete the goal
      await supabase
        .from('user_goals')
        .delete()
        .eq('id', goalId);

      // Verify all embeddings are deleted
      for (const embeddingId of embeddingIds) {
        const { data } = await supabase
          .from('goal_embeddings')
          .select('*')
          .eq('id', embeddingId)
          .single();
        expect(data).toBeNull();
      }

      // Cleanup
      await supabase.auth.admin.deleteUser(userId);
    });

    test('orphaned embeddings are prevented', async () => {
      const embedding = new Array(1536).fill(0.3);

      // Try to create profile embedding with non-existent user
      const { error: profileError } = await supabase
        .from('profile_embeddings')
        .insert({
          user_id: crypto.randomUUID(), // Non-existent user
          content_hash: 'orphan-hash',
          embedding,
          metadata: {
            source_field: 'about_me',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        });

      expect(profileError).toBeDefined();
      expect(profileError?.code).toBe('23503'); // Foreign key violation

      // Try to create goal embedding with non-existent goal
      const { error: goalError } = await supabase
        .from('goal_embeddings')
        .insert({
          goal_id: crypto.randomUUID(), // Non-existent goal
          user_id: crypto.randomUUID(),
          content_hash: 'orphan-goal-hash',
          embedding,
          metadata: {
            source_field: 'goal_description',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        });

      expect(goalError).toBeDefined();
      expect(goalError?.code).toBe('23503'); // Foreign key violation
    });
  });

  describe('Check constraints', () => {
    let testUserId: string;

    beforeEach(async () => {
      testUserId = crypto.randomUUID();
      const email = `test-constraints-${Date.now()}@example.com`;

      await supabase.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        user_metadata: { id: testUserId }
      });

      await supabase.from('profiles').insert({
        id: testUserId,
        email
      });
    });

    afterEach(async () => {
      if (testUserId) {
        await supabase.auth.admin.deleteUser(testUserId);
      }
    });

    test('experience_level only accepts valid enum values', async () => {
      // Valid values should work
      const validLevels = ['beginner', 'intermediate', 'advanced'];
      for (const level of validLevels) {
        const { error } = await supabase
          .from('profiles')
          .update({ experience_level: level as any })
          .eq('id', testUserId);
        expect(error).toBeNull();
      }

      // Invalid value should fail
      const { error } = await supabase
        .from('profiles')
        .update({ experience_level: 'expert' as any })
        .eq('id', testUserId);

      expect(error).toBeDefined();
      expect(error?.code).toBe('22P02'); // Invalid text representation
    });

    test('target_value must be positive', async () => {
      // Positive value should work
      const { error: validError } = await supabase
        .from('user_goals')
        .insert({
          user_id: testUserId,
          goal_type: 'weight_loss',
          goal_description: 'Test goal',
          target_value: 10,
          priority: 1,
          is_active: true
        });

      expect(validError).toBeNull();

      // Zero should fail
      const { error: zeroError } = await supabase
        .from('user_goals')
        .insert({
          user_id: testUserId,
          goal_type: 'muscle_gain',
          goal_description: 'Test goal',
          target_value: 0,
          priority: 1,
          is_active: true
        });

      expect(zeroError).toBeDefined();
      expect(zeroError?.code).toBe('23514'); // Check constraint violation

      // Negative should fail
      const { error: negativeError } = await supabase
        .from('user_goals')
        .insert({
          user_id: testUserId,
          goal_type: 'strength',
          goal_description: 'Test goal',
          target_value: -5,
          priority: 1,
          is_active: true
        });

      expect(negativeError).toBeDefined();
      expect(negativeError?.code).toBe('23514'); // Check constraint violation
    });

    test('target_date cannot be in the past', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);

      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 3);

      // Future date should work
      const { error: futureError } = await supabase
        .from('user_goals')
        .insert({
          user_id: testUserId,
          goal_type: 'flexibility',
          goal_description: 'Future goal',
          target_date: futureDate.toISOString(),
          priority: 1,
          is_active: true
        });

      expect(futureError).toBeNull();

      // Past date should fail
      const { error: pastError } = await supabase
        .from('user_goals')
        .insert({
          user_id: testUserId,
          goal_type: 'general_fitness',
          goal_description: 'Past goal',
          target_date: pastDate.toISOString(),
          priority: 1,
          is_active: true
        });

      expect(pastError).toBeDefined();
      expect(pastError?.code).toBe('23514'); // Check constraint violation
    });

    test('priority must be between 1 and 5', async () => {
      // Valid priorities should work
      for (let priority = 1; priority <= 5; priority++) {
        const { error } = await supabase
          .from('user_goals')
          .insert({
            user_id: testUserId,
            goal_type: 'sports_performance',
            goal_description: `Priority ${priority} goal`,
            priority,
            is_active: true
          });
        expect(error).toBeNull();
      }

      // Priority 0 should fail
      const { error: zeroError } = await supabase
        .from('user_goals')
        .insert({
          user_id: testUserId,
          goal_type: 'rehabilitation',
          goal_description: 'Invalid priority 0',
          priority: 0,
          is_active: true
        });

      expect(zeroError).toBeDefined();
      expect(zeroError?.code).toBe('23514'); // Check constraint violation

      // Priority 6 should fail
      const { error: sixError } = await supabase
        .from('user_goals')
        .insert({
          user_id: testUserId,
          goal_type: 'other',
          goal_description: 'Invalid priority 6',
          priority: 6,
          is_active: true
        });

      expect(sixError).toBeDefined();
      expect(sixError?.code).toBe('23514'); // Check constraint violation
    });

    test('arrays cannot contain null values', async () => {
      // Valid arrays should work
      const { error: validError } = await supabase
        .from('profiles')
        .update({
          fitness_goals: ['weight_loss', 'muscle_gain'],
          available_equipment: ['dumbbells', 'barbell'],
          dietary_preferences: ['vegetarian', 'high_protein']
        })
        .eq('id', testUserId);

      expect(validError).toBeNull();

      // Arrays with null should fail
      const { error: nullError } = await supabase
        .from('profiles')
        .update({
          fitness_goals: ['weight_loss', null as any, 'muscle_gain']
        })
        .eq('id', testUserId);

      expect(nullError).toBeDefined();
    });
  });

  describe('Trigger functions', () => {
    let testUserId: string;

    beforeEach(async () => {
      testUserId = crypto.randomUUID();
      const email = `test-triggers-${Date.now()}@example.com`;

      await supabase.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        user_metadata: { id: testUserId }
      });

      await supabase.from('profiles').insert({
        id: testUserId,
        email
      });
    });

    afterEach(async () => {
      if (testUserId) {
        await supabase.auth.admin.deleteUser(testUserId);
      }
    });

    test('updated_at is automatically updated on profile change', async () => {
      // Get initial updated_at
      const { data: initialData } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', testUserId)
        .single();

      const initialUpdatedAt = initialData!.updated_at;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile
      await supabase
        .from('profiles')
        .update({ full_name: 'Updated Name' })
        .eq('id', testUserId);

      // Get new updated_at
      const { data: updatedData } = await supabase
        .from('profiles')
        .select('updated_at')
        .eq('id', testUserId)
        .single();

      const newUpdatedAt = updatedData!.updated_at;

      // Verify updated_at changed
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(
        new Date(initialUpdatedAt).getTime()
      );
    });

    test('updated_at is automatically updated on goal change', async () => {
      // Create a goal
      const { data: goalData } = await supabase
        .from('user_goals')
        .insert({
          user_id: testUserId,
          goal_type: 'weight_loss',
          goal_description: 'Initial goal',
          priority: 1,
          is_active: true
        })
        .select('id, updated_at')
        .single();

      const goalId = goalData!.id;
      const initialUpdatedAt = goalData!.updated_at;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update goal
      await supabase
        .from('user_goals')
        .update({ goal_description: 'Updated goal' })
        .eq('id', goalId);

      // Get new updated_at
      const { data: updatedData } = await supabase
        .from('user_goals')
        .select('updated_at')
        .eq('id', goalId)
        .single();

      const newUpdatedAt = updatedData!.updated_at;

      // Verify updated_at changed
      expect(new Date(newUpdatedAt).getTime()).toBeGreaterThan(
        new Date(initialUpdatedAt).getTime()
      );
    });
  });
});