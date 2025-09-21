import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface TestUser {
  id: string;
  email: string;
  password: string;
  client: SupabaseClient<Database>;
}

describe('Row Level Security Policies', () => {
  let userA: TestUser;
  let userB: TestUser;
  let serviceClient: SupabaseClient<Database>;

  const createTestUser = async (suffix: string): Promise<TestUser> => {
    const email = `test-${suffix}-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    // Create user with service role
    const { data: authUser, error } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (error || !authUser.user) {
      throw new Error(`Failed to create test user: ${error?.message}`);
    }

    // Create client for this user
    const userClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
    await userClient.auth.signInWithPassword({ email, password });

    return {
      id: authUser.user.id,
      email,
      password,
      client: userClient
    };
  };

  beforeAll(async () => {
    serviceClient = createClient<Database>(supabaseUrl, supabaseServiceKey);
  });

  beforeEach(async () => {
    userA = await createTestUser('a');
    userB = await createTestUser('b');

    // Create profiles for test users
    await serviceClient.from('profiles').insert([
      {
        id: userA.id,
        email: userA.email,
        full_name: 'User A',
        about_me: 'Test user A profile'
      },
      {
        id: userB.id,
        email: userB.email,
        full_name: 'User B',
        about_me: 'Test user B profile'
      }
    ]);
  });

  afterEach(async () => {
    // Cleanup test users
    if (userA?.id) {
      await serviceClient.auth.admin.deleteUser(userA.id);
    }
    if (userB?.id) {
      await serviceClient.auth.admin.deleteUser(userB.id);
    }
  });

  describe('profiles table RLS', () => {
    test('user can read own profile', async () => {
      const { data, error } = await userA.client
        .from('profiles')
        .select('*')
        .eq('id', userA.id)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(userA.id);
      expect(data?.about_me).toBe('Test user A profile');
    });

    test('user cannot read another users profile', async () => {
      const { data, error } = await userA.client
        .from('profiles')
        .select('*')
        .eq('id', userB.id)
        .single();

      expect(data).toBeNull();
      // RLS should prevent the read, returning no data
    });

    test('user can update own profile', async () => {
      const updatedAboutMe = 'Updated profile for user A';

      const { error } = await userA.client
        .from('profiles')
        .update({ about_me: updatedAboutMe })
        .eq('id', userA.id);

      expect(error).toBeNull();

      // Verify the update
      const { data } = await userA.client
        .from('profiles')
        .select('about_me')
        .eq('id', userA.id)
        .single();

      expect(data?.about_me).toBe(updatedAboutMe);
    });

    test('user cannot update another users profile', async () => {
      const { error } = await userA.client
        .from('profiles')
        .update({ about_me: 'Hacked!' })
        .eq('id', userB.id);

      // Should fail silently (no rows affected)
      expect(error).toBeNull();

      // Verify profile wasn't changed
      const { data } = await serviceClient
        .from('profiles')
        .select('about_me')
        .eq('id', userB.id)
        .single();

      expect(data?.about_me).toBe('Test user B profile');
    });

    test('user cannot delete another users profile', async () => {
      const { error } = await userA.client
        .from('profiles')
        .delete()
        .eq('id', userB.id);

      // Should fail silently
      expect(error).toBeNull();

      // Verify profile still exists
      const { data } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('id', userB.id)
        .single();

      expect(data).toBeDefined();
    });

    test('anonymous user cannot access any profiles', async () => {
      const anonClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

      const { data, error } = await anonClient
        .from('profiles')
        .select('*');

      expect(data).toEqual([]);
    });
  });

  describe('user_goals table RLS', () => {
    let goalA: string;
    let goalB: string;

    beforeEach(async () => {
      // Create test goals
      const { data: goalDataA } = await serviceClient
        .from('user_goals')
        .insert({
          user_id: userA.id,
          goal_type: 'weight_loss',
          goal_description: 'Lose 10 pounds',
          target_value: 10,
          target_unit: 'lbs',
          priority: 1,
          is_active: true
        })
        .select('id')
        .single();

      const { data: goalDataB } = await serviceClient
        .from('user_goals')
        .insert({
          user_id: userB.id,
          goal_type: 'muscle_gain',
          goal_description: 'Gain 5 pounds of muscle',
          target_value: 5,
          target_unit: 'lbs',
          priority: 2,
          is_active: true
        })
        .select('id')
        .single();

      goalA = goalDataA!.id;
      goalB = goalDataB!.id;
    });

    test('user can create goals for themselves', async () => {
      const { data, error } = await userA.client
        .from('user_goals')
        .insert({
          user_id: userA.id,
          goal_type: 'strength',
          goal_description: 'Bench press 200 lbs',
          target_value: 200,
          target_unit: 'lbs',
          priority: 3,
          is_active: true
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(userA.id);
    });

    test('user cannot create goals for another user', async () => {
      const { error } = await userA.client
        .from('user_goals')
        .insert({
          user_id: userB.id, // Trying to create for user B
          goal_type: 'endurance',
          goal_description: 'Run 5 miles',
          target_value: 5,
          target_unit: 'miles',
          priority: 1,
          is_active: true
        });

      expect(error).toBeDefined();
      expect(error?.code).toBe('42501'); // Insufficient privilege
    });

    test('user can read own goals', async () => {
      const { data, error } = await userA.client
        .from('user_goals')
        .select('*')
        .eq('user_id', userA.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].id).toBe(goalA);
    });

    test('user cannot read another users goals', async () => {
      const { data, error } = await userA.client
        .from('user_goals')
        .select('*')
        .eq('user_id', userB.id);

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    test('user can update own goals', async () => {
      const { error } = await userA.client
        .from('user_goals')
        .update({ target_value: 15 })
        .eq('id', goalA);

      expect(error).toBeNull();

      // Verify update
      const { data } = await userA.client
        .from('user_goals')
        .select('target_value')
        .eq('id', goalA)
        .single();

      expect(data?.target_value).toBe(15);
    });

    test('user cannot update another users goals', async () => {
      const { error } = await userA.client
        .from('user_goals')
        .update({ target_value: 999 })
        .eq('id', goalB);

      // Should fail silently
      expect(error).toBeNull();

      // Verify no change
      const { data } = await serviceClient
        .from('user_goals')
        .select('target_value')
        .eq('id', goalB)
        .single();

      expect(data?.target_value).toBe(5);
    });

    test('user can delete own goals', async () => {
      const { error } = await userA.client
        .from('user_goals')
        .delete()
        .eq('id', goalA);

      expect(error).toBeNull();

      // Verify deletion
      const { data } = await serviceClient
        .from('user_goals')
        .select('id')
        .eq('id', goalA)
        .single();

      expect(data).toBeNull();
    });

    test('user cannot delete another users goals', async () => {
      const { error } = await userA.client
        .from('user_goals')
        .delete()
        .eq('id', goalB);

      // Should fail silently
      expect(error).toBeNull();

      // Verify goal still exists
      const { data } = await serviceClient
        .from('user_goals')
        .select('id')
        .eq('id', goalB)
        .single();

      expect(data).toBeDefined();
    });
  });

  describe('profile_embeddings table RLS', () => {
    test('service role can create embeddings for any user', async () => {
      const embedding = new Array(1536).fill(0.1);

      const { data, error } = await serviceClient
        .from('profile_embeddings')
        .insert({
          user_id: userA.id,
          content_hash: 'test-hash-a',
          embedding,
          metadata: {
            source_field: 'about_me',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(userA.id);
    });

    test('user can read own embeddings', async () => {
      // First create an embedding with service role
      const embedding = new Array(1536).fill(0.2);
      await serviceClient
        .from('profile_embeddings')
        .insert({
          user_id: userA.id,
          content_hash: 'read-test-hash',
          embedding,
          metadata: {
            source_field: 'about_me',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        });

      // Now try to read with user client
      const { data, error } = await userA.client
        .from('profile_embeddings')
        .select('*')
        .eq('user_id', userA.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].content_hash).toBe('read-test-hash');
    });

    test('user cannot read another users embeddings', async () => {
      // Create embedding for user B
      const embedding = new Array(1536).fill(0.3);
      await serviceClient
        .from('profile_embeddings')
        .insert({
          user_id: userB.id,
          content_hash: 'private-hash',
          embedding,
          metadata: {
            source_field: 'about_me',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        });

      // Try to read with user A client
      const { data } = await userA.client
        .from('profile_embeddings')
        .select('*')
        .eq('user_id', userB.id);

      expect(data).toEqual([]);
    });

    test('user cannot directly create/update/delete embeddings', async () => {
      const embedding = new Array(1536).fill(0.4);

      // Try to create
      const { error: createError } = await userA.client
        .from('profile_embeddings')
        .insert({
          user_id: userA.id,
          content_hash: 'unauthorized-hash',
          embedding,
          metadata: {
            source_field: 'about_me',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        });

      expect(createError).toBeDefined();
      expect(createError?.code).toBe('42501'); // Insufficient privilege

      // Create one with service role to test update/delete
      const { data: testEmbedding } = await serviceClient
        .from('profile_embeddings')
        .insert({
          user_id: userA.id,
          content_hash: 'test-modify-hash',
          embedding,
          metadata: {
            source_field: 'about_me',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        })
        .select()
        .single();

      // Try to update
      const { error: updateError } = await userA.client
        .from('profile_embeddings')
        .update({ content_hash: 'hacked-hash' })
        .eq('id', testEmbedding!.id);

      expect(updateError).toBeDefined();

      // Try to delete
      const { error: deleteError } = await userA.client
        .from('profile_embeddings')
        .delete()
        .eq('id', testEmbedding!.id);

      expect(deleteError).toBeDefined();
    });
  });

  describe('goal_embeddings table RLS', () => {
    let goalA: string;

    beforeEach(async () => {
      // Create a goal for user A
      const { data } = await serviceClient
        .from('user_goals')
        .insert({
          user_id: userA.id,
          goal_type: 'flexibility',
          goal_description: 'Improve flexibility for touching toes',
          priority: 1,
          is_active: true
        })
        .select('id')
        .single();

      goalA = data!.id;
    });

    test('service role can create goal embeddings', async () => {
      const embedding = new Array(1536).fill(0.5);

      const { data, error } = await serviceClient
        .from('goal_embeddings')
        .insert({
          goal_id: goalA,
          user_id: userA.id,
          content_hash: 'goal-hash',
          embedding,
          metadata: {
            source_field: 'goal_description',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.goal_id).toBe(goalA);
    });

    test('user can read embeddings for own goals', async () => {
      // Create embedding with service role
      const embedding = new Array(1536).fill(0.6);
      await serviceClient
        .from('goal_embeddings')
        .insert({
          goal_id: goalA,
          user_id: userA.id,
          content_hash: 'own-goal-hash',
          embedding,
          metadata: {
            source_field: 'goal_description',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        });

      // Read with user client
      const { data, error } = await userA.client
        .from('goal_embeddings')
        .select('*')
        .eq('user_id', userA.id);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].content_hash).toBe('own-goal-hash');
    });

    test('user cannot read embeddings for another users goals', async () => {
      // Create goal for user B
      const { data: goalData } = await serviceClient
        .from('user_goals')
        .insert({
          user_id: userB.id,
          goal_type: 'sports_performance',
          goal_description: 'Improve tennis serve',
          priority: 1,
          is_active: true
        })
        .select('id')
        .single();

      // Create embedding for user B's goal
      const embedding = new Array(1536).fill(0.7);
      await serviceClient
        .from('goal_embeddings')
        .insert({
          goal_id: goalData!.id,
          user_id: userB.id,
          content_hash: 'private-goal-hash',
          embedding,
          metadata: {
            source_field: 'goal_description',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        });

      // Try to read with user A
      const { data } = await userA.client
        .from('goal_embeddings')
        .select('*')
        .eq('user_id', userB.id);

      expect(data).toEqual([]);
    });

    test('embeddings are deleted when goal is deleted', async () => {
      // Create embedding
      const embedding = new Array(1536).fill(0.8);
      const { data: embeddingData } = await serviceClient
        .from('goal_embeddings')
        .insert({
          goal_id: goalA,
          user_id: userA.id,
          content_hash: 'cascade-test-hash',
          embedding,
          metadata: {
            source_field: 'goal_description',
            generated_at: new Date().toISOString(),
            model: 'text-embedding-ada-002'
          }
        })
        .select('id')
        .single();

      // Delete the goal
      await serviceClient
        .from('user_goals')
        .delete()
        .eq('id', goalA);

      // Check embedding is gone
      const { data } = await serviceClient
        .from('goal_embeddings')
        .select('id')
        .eq('id', embeddingData!.id)
        .single();

      expect(data).toBeNull();
    });
  });
});