/**
 * Embedding Generation Tests
 * Testing vector embedding creation and storage
 */

import { createClient } from '@/lib/supabase/client';

describe('Embedding Generation', () => {
  const supabase = createClient();
  const testUserId = 'test-user-embeddings';

  beforeEach(async () => {
    // Clean up test data
    await supabase
      .from('user_context_embeddings')
      .delete()
      .eq('user_id', testUserId);
  });

  describe('Workout Embedding Generation', () => {
    it('should generate embeddings for workout completions', async () => {
      // Create a test workout completion
      const workoutContent = `
        Completed Push Day workout:
        - Bench Press: 4 sets x 8 reps @ 185 lbs
        - Incline Dumbbell Press: 3 sets x 10 reps @ 60 lbs
        - Cable Flyes: 3 sets x 12 reps @ 30 lbs
        Duration: 45 minutes
        Notes: Felt strong on bench, good pump
      `;

      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: workoutContent,
          contentType: 'workout',
          userId: testUserId
        })
      });

      const data = await response.json();

      // Verify embedding dimensions (768 for Google's model)
      expect(data.embedding).toHaveLength(768);
      expect(data.embedding[0]).toBeGreaterThanOrEqual(-1);
      expect(data.embedding[0]).toBeLessThanOrEqual(1);

      // Check database storage
      const { data: stored } = await supabase
        .from('user_context_embeddings')
        .select('*')
        .eq('user_id', testUserId)
        .eq('content_type', 'workout')
        .single();

      expect(stored).toBeTruthy();
      expect(stored.embedding).toHaveLength(768);
      expect(stored.content).toBe(workoutContent);
    });

    it('should generate embeddings for user goals', async () => {
      const goalContent = `
        Primary goal: Build muscle mass
        Target: Gain 15 lbs of lean muscle
        Timeline: 6 months
        Current weight: 170 lbs
        Experience: Intermediate lifter (3 years)
        Preferred training style: Push/Pull/Legs split
      `;

      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: goalContent,
          contentType: 'goal',
          userId: testUserId
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.embedding).toHaveLength(768);
      expect(data.stored).toBe(true);

      // Verify in database
      const { data: stored } = await supabase
        .from('user_context_embeddings')
        .select('*')
        .eq('user_id', testUserId)
        .eq('content_type', 'goal')
        .single();

      expect(stored.content).toBe(goalContent);
    });

    it('should batch process multiple embeddings', async () => {
      const contents = [
        { content: 'Chest workout completed', type: 'workout' },
        { content: 'New PR on bench press: 225 lbs', type: 'achievement' },
        { content: 'Feeling stronger this week', type: 'progress' }
      ];

      const promises = contents.map(item =>
        fetch('/api/embeddings/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: item.content,
            contentType: item.type,
            userId: testUserId
          })
        })
      );

      const responses = await Promise.all(promises);
      const data = await Promise.all(responses.map(r => r.json()));

      // Verify all embeddings generated
      expect(data).toHaveLength(3);
      data.forEach(embedding => {
        expect(embedding.embedding).toHaveLength(768);
        expect(embedding.stored).toBe(true);
      });

      // Check all stored in database
      const { data: stored } = await supabase
        .from('user_context_embeddings')
        .select('*')
        .eq('user_id', testUserId);

      expect(stored).toHaveLength(3);
    });

    it('should handle embedding generation errors gracefully', async () => {
      // Send invalid content type
      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '',  // Empty content
          contentType: 'workout',
          userId: testUserId
        })
      });

      expect(response.ok).toBe(false);
      const error = await response.json();
      expect(error.error).toContain('Content cannot be empty');
    });
  });

  describe('Conversation Embeddings', () => {
    it('should generate embeddings for coaching conversations', async () => {
      const conversationContent = `
        User: How can I improve my bench press?
        Coach: To improve your bench press, focus on:
        1. Progressive overload - add 5 lbs each week
        2. Proper form - retract shoulder blades, arch back
        3. Accessory work - tricep dips, close-grip bench
        4. Frequency - bench 2-3x per week
      `;

      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: conversationContent,
          contentType: 'conversation',
          userId: testUserId,
          metadata: {
            topic: 'bench_press_improvement',
            messageCount: 2
          }
        })
      });

      const data = await response.json();

      expect(data.embedding).toHaveLength(768);

      // Check metadata storage
      const { data: stored } = await supabase
        .from('user_context_embeddings')
        .select('*')
        .eq('user_id', testUserId)
        .eq('content_type', 'conversation')
        .single();

      expect(stored.metadata).toEqual({
        topic: 'bench_press_improvement',
        messageCount: 2
      });
    });
  });

  describe('Progress Embeddings', () => {
    it('should generate embeddings for progress updates', async () => {
      const progressContent = `
        Week 4 Progress Update:
        - Weight: 172 lbs (+2 lbs)
        - Bench Press 1RM: 205 lbs (+10 lbs)
        - Squat 1RM: 285 lbs (+15 lbs)
        - Body Fat: 14% (-1%)
        - Weekly workout completion: 5/5
        Feeling stronger, recovery improving
      `;

      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: progressContent,
          contentType: 'progress',
          userId: testUserId,
          metadata: {
            week: 4,
            metrics: ['weight', 'strength', 'body_composition']
          }
        })
      });

      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.embedding).toHaveLength(768);
      expect(data.id).toBeTruthy();
    });
  });

  describe('Embedding Updates', () => {
    it('should update existing embeddings when content changes', async () => {
      // Create initial embedding
      const initialContent = 'Initial workout notes';

      const response1 = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: initialContent,
          contentType: 'workout',
          userId: testUserId,
          contentId: 'workout-123'
        })
      });

      const data1 = await response1.json();
      const initialEmbedding = data1.embedding;

      // Update with new content
      const updatedContent = 'Updated workout notes with more details';

      const response2 = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: updatedContent,
          contentType: 'workout',
          userId: testUserId,
          contentId: 'workout-123',
          update: true
        })
      });

      const data2 = await response2.json();

      // Embeddings should be different
      expect(data2.embedding).not.toEqual(initialEmbedding);

      // Should only have one record in database
      const { data: stored, count } = await supabase
        .from('user_context_embeddings')
        .select('*', { count: 'exact' })
        .eq('user_id', testUserId)
        .eq('content_type', 'workout');

      expect(count).toBe(1);
      expect(stored?.[0].content).toBe(updatedContent);
    });
  });

  describe('Performance', () => {
    it('should generate embeddings within acceptable time limits', async () => {
      const longContent = `
        ${Array(100).fill('This is a test sentence.').join(' ')}
      `;

      const startTime = Date.now();

      const response = await fetch('/api/embeddings/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: longContent,
          contentType: 'workout',
          userId: testUserId
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds

      const data = await response.json();
      expect(data.embedding).toHaveLength(768);
    });
  });
});