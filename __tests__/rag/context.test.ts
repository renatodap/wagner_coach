/**
 * RAG (Retrieval-Augmented Generation) Context Tests
 * Testing context retrieval and augmented response generation
 */

import { createClient } from '@/lib/supabase/client';

describe('RAG Context System', () => {
  const supabase = createClient();
  const testUserId = 'test-user-rag';

  beforeAll(async () => {
    // Set up comprehensive test data
    await setupTestUserData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  async function setupTestUserData() {
    // Create test user profile
    await supabase.from('profiles').upsert({
      id: testUserId,
      full_name: 'Test User',
      goal: 'build_muscle',
      onboarding_completed: true
    });

    // Create workout history
    const workoutData = [
      {
        user_id: testUserId,
        workout_id: 1,
        started_at: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        completed_at: new Date(Date.now() - 83400000).toISOString(),
        duration_minutes: 50,
        notes: 'Great chest workout, hit new PR on bench',
        rating: 5
      },
      {
        user_id: testUserId,
        workout_id: 2,
        started_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        completed_at: new Date(Date.now() - 169200000).toISOString(),
        duration_minutes: 60,
        notes: 'Back day, focused on pull-ups',
        rating: 4
      }
    ];

    await supabase.from('workout_completions').insert(workoutData);

    // Create personal records
    await supabase.from('personal_records').insert([
      {
        user_id: testUserId,
        exercise_id: 1,
        record_type: '1rm',
        value: 225,
        achieved_date: new Date().toISOString()
      }
    ]);
  }

  async function cleanupTestData() {
    await supabase.from('workout_completions').delete().eq('user_id', testUserId);
    await supabase.from('personal_records').delete().eq('user_id', testUserId);
    await supabase.from('user_context_embeddings').delete().eq('user_id', testUserId);
    await supabase.from('ai_conversations').delete().eq('user_id', testUserId);
    await supabase.from('profiles').delete().eq('id', testUserId);
  }

  describe('Context Retrieval', () => {
    it('should gather complete user context', async () => {
      const response = await fetch(`/api/context?userId=${testUserId}`);
      const context = await response.json();

      expect(response.ok).toBe(true);
      expect(context).toHaveProperty('profile');
      expect(context).toHaveProperty('workouts');
      expect(context).toHaveProperty('progress');
      expect(context).toHaveProperty('conversations');

      // Verify profile data
      expect(context.profile.goal).toBe('build_muscle');

      // Verify workout history
      expect(context.workouts.recent).toHaveLength(2);
      expect(context.workouts.recent[0].notes).toContain('chest workout');

      // Verify progress data
      expect(context.progress.personalRecords).toHaveLength(1);
      expect(context.progress.personalRecords[0].value).toBe(225);
    });

    it('should prioritize recent context', async () => {
      // Add more historical data
      const oldWorkout = {
        user_id: testUserId,
        workout_id: 3,
        started_at: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
        completed_at: new Date(Date.now() - 2588400000).toISOString(),
        duration_minutes: 45,
        notes: 'Old workout',
        rating: 3
      };

      await supabase.from('workout_completions').insert(oldWorkout);

      const response = await fetch(`/api/context?userId=${testUserId}`);
      const context = await response.json();

      // Recent workouts should be prioritized
      const recentWorkouts = context.workouts.recent;
      expect(recentWorkouts[0].notes).not.toContain('Old workout');

      // Verify temporal weighting
      const dates = recentWorkouts.map((w: any) => new Date(w.completedAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });

    it('should include relevant conversation history', async () => {
      // Create test conversations
      const conversation = {
        user_id: testUserId,
        messages: [
          {
            id: '1',
            role: 'user',
            content: 'How can I improve my bench press?',
            timestamp: new Date()
          },
          {
            id: '2',
            role: 'assistant',
            content: 'Focus on progressive overload and proper form',
            timestamp: new Date()
          }
        ],
        created_at: new Date().toISOString()
      };

      await supabase.from('ai_conversations').insert(conversation);

      const response = await fetch(`/api/context?userId=${testUserId}`);
      const context = await response.json();

      expect(context.conversations.topics).toContain('bench_press');
      expect(context.conversations.sessionCount).toBeGreaterThan(0);
    });

    it('should handle missing data gracefully', async () => {
      // Test with user that has no data
      const emptyUserId = 'empty-user-123';

      await supabase.from('profiles').insert({
        id: emptyUserId,
        full_name: 'Empty User',
        goal: 'build_muscle'
      });

      const response = await fetch(`/api/context?userId=${emptyUserId}`);
      const context = await response.json();

      expect(response.ok).toBe(true);
      expect(context.workouts.recent).toEqual([]);
      expect(context.progress.personalRecords).toEqual([]);
      expect(context.conversations.sessionCount).toBe(0);

      // Cleanup
      await supabase.from('profiles').delete().eq('id', emptyUserId);
    });
  });

  describe('Semantic Search', () => {
    beforeEach(async () => {
      // Generate embeddings for test data
      const contents = [
        { content: 'Chest workout with bench press PR', type: 'workout' },
        { content: 'Struggling with squat form', type: 'conversation' },
        { content: 'Goal: Build upper body strength', type: 'goal' }
      ];

      for (const item of contents) {
        await fetch('/api/embeddings/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: item.content,
            contentType: item.type,
            userId: testUserId
          })
        });
      }
    });

    it('should find relevant workout context', async () => {
      const response = await fetch('/api/embeddings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'chest exercises and bench press',
          userId: testUserId,
          limit: 5
        })
      });

      const results = await response.json();

      expect(response.ok).toBe(true);
      expect(results.results).toBeInstanceOf(Array);
      expect(results.results.length).toBeGreaterThan(0);

      // First result should be most relevant
      const topResult = results.results[0];
      expect(topResult.content).toContain('bench press');
      expect(topResult.similarity).toBeGreaterThan(0.7);
    });

    it('should retrieve similar exercises and patterns', async () => {
      const response = await fetch('/api/embeddings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'upper body strength training',
          userId: testUserId,
          contentTypes: ['goal', 'workout']
        })
      });

      const results = await response.json();

      expect(results.results).toBeInstanceOf(Array);

      // Should find both goal and workout content
      const contentTypes = results.results.map((r: any) => r.contentType);
      expect(contentTypes).toContain('goal');
      expect(contentTypes).toContain('workout');
    });

    it('should respect similarity threshold', async () => {
      const response = await fetch('/api/embeddings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'completely unrelated topic like cooking',
          userId: testUserId,
          threshold: 0.8
        })
      });

      const results = await response.json();

      // Should return no results due to low similarity
      expect(results.results).toHaveLength(0);
    });

    it('should enforce user isolation in search', async () => {
      // Create embedding for different user
      const otherUserId = 'other-user-123';

      await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: 'Secret workout routine',
          contentType: 'workout',
          userId: otherUserId
        })
      });

      // Search as original user
      const response = await fetch('/api/embeddings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'secret workout routine',
          userId: testUserId
        })
      });

      const results = await response.json();

      // Should not find other user's content
      const contents = results.results.map((r: any) => r.content);
      expect(contents).not.toContain('Secret workout routine');

      // Cleanup
      await supabase
        .from('user_context_embeddings')
        .delete()
        .eq('user_id', otherUserId);
    });
  });

  describe('Augmented Generation', () => {
    it('should generate personalized responses with context', async () => {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'How am I progressing with my goals?',
          userId: testUserId
        })
      });

      expect(response.ok).toBe(true);

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value);
        }
      }

      // Response should reference actual user data
      expect(fullResponse).toContain('muscle');
      expect(fullResponse).toMatch(/bench press|225|PR/i);
    });

    it('should provide workout recommendations based on history', async () => {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'What should I do for my next workout?',
          userId: testUserId
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value);
        }
      }

      // Should suggest appropriate next workout based on history
      expect(fullResponse).toMatch(/legs|lower body|squat/i); // Since recent was chest and back
      expect(fullResponse).toContain('workout');
    });

    it('should analyze performance trends accurately', async () => {
      // Add more workout data for trend analysis
      const additionalWorkouts = [
        {
          user_id: testUserId,
          workout_id: 1,
          started_at: new Date(Date.now() - 604800000).toISOString(), // 7 days ago
          completed_at: new Date(Date.now() - 601200000).toISOString(),
          duration_minutes: 48,
          notes: 'Bench press: 215 lbs',
          rating: 4
        },
        {
          user_id: testUserId,
          workout_id: 1,
          started_at: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
          completed_at: new Date(Date.now() - 1206000000).toISOString(),
          duration_minutes: 52,
          notes: 'Bench press: 205 lbs',
          rating: 4
        }
      ];

      await supabase.from('workout_completions').insert(additionalWorkouts);

      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Analyze my bench press progression',
          userId: testUserId
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value);
        }
      }

      // Should identify progression trend
      expect(fullResponse).toMatch(/progress|improving|gains|20.*lbs/i);
      expect(fullResponse).toContain('225');
    });

    it('should handle context retrieval errors gracefully', async () => {
      // Simulate database error by using invalid user ID
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Test message',
          userId: 'invalid-uuid-format'
        })
      });

      expect(response.ok).toBe(false);
      const error = await response.json();
      expect(error.error).toBeDefined();
      expect(error.userMessage).toContain('Sorry');
    });
  });

  describe('Performance Metrics', () => {
    it('should retrieve context within acceptable time', async () => {
      const startTime = Date.now();

      const response = await fetch(`/api/context?userId=${testUserId}`);
      await response.json();

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should perform semantic search efficiently', async () => {
      // Generate more embeddings for realistic test
      const contents = Array(20).fill(null).map((_, i) => ({
        content: `Workout session ${i}: Various exercises`,
        type: 'workout'
      }));

      for (const item of contents) {
        await fetch('/api/embeddings/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: item.content,
            contentType: item.type,
            userId: testUserId
          })
        });
      }

      const startTime = Date.now();

      const response = await fetch('/api/embeddings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'workout exercises',
          userId: testUserId,
          limit: 10
        })
      });

      await response.json();

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500); // Should complete within 500ms
    });
  });
});