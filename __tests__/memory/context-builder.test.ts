/**
 * Unit tests for Enhanced Context Builder
 * These tests are written before implementation (TDD - Red phase)
 */

import { EnhancedContextBuilder } from '@/lib/ai/enhanced-context';
import {
  EnhancedUserContext,
  MemoryFact,
  ConversationSummary,
  PreferenceProfile,
  WorkoutPattern,
  NutritionPattern,
  LongTermTrends,
} from '@/types/memory';
import { createClient } from '@/utils/supabase/server';

// Mock Supabase
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('EnhancedContextBuilder', () => {
  let contextBuilder: EnhancedContextBuilder;
  let mockSupabase: any;
  const userId = 'test-user-123';

  beforeEach(() => {
    mockSupabase = {
      rpc: jest.fn(),
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        single: jest.fn(),
      })),
    };
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    contextBuilder = new EnhancedContextBuilder();
  });

  describe('buildContext', () => {
    it('should build complete enhanced context', async () => {
      // Given - Mock RPC response with enhanced data
      mockSupabase.rpc.mockResolvedValue({
        data: {
          profile: { id: userId, name: 'Test User' },
          recent_workouts: Array(50).fill({ id: 'workout-1' }), // 50 workouts
          recent_meals: Array(100).fill({ id: 'meal-1' }), // 100 meals
          recent_activities: Array(100).fill({ id: 'activity-1' }), // 100 activities
          goals: [{ id: 'goal-1', name: 'Lose weight' }],
          workout_patterns: [
            { day_of_week: 1, hour_of_day: 6, frequency: 10 }
          ],
          nutrition_patterns: [
            { meal_type: 'breakfast', avg_calories: 400 }
          ],
        },
        error: null,
      });

      // Mock memory facts
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: [
          { id: 'fact-1', content: 'Prefers morning workouts', confidence: 0.9 }
        ],
        error: null,
      });

      // When
      const context = await contextBuilder.buildContext(userId);

      // Then
      expect(context).toBeDefined();
      expect(context.profile).toBeDefined();
      expect(context.recentWorkouts).toHaveLength(50);
      expect(context.recentMeals).toHaveLength(100);
      expect(context.recentActivities).toHaveLength(100);
      expect(context.workoutPatterns).toBeDefined();
      expect(context.nutritionPatterns).toBeDefined();
      expect(context.memoryFacts).toBeDefined();
      expect(context.conversationSummaries).toBeDefined();
      expect(context.preferenceProfile).toBeDefined();
      expect(context.longTermTrends).toBeDefined();
    });

    it('should fetch all context data in parallel', async () => {
      // Given
      const rpcPromise = new Promise(resolve =>
        setTimeout(() => resolve({ data: mockContextData(), error: null }), 50)
      );
      mockSupabase.rpc.mockReturnValue(rpcPromise);

      // When
      const startTime = Date.now();
      await contextBuilder.buildContext(userId);
      const duration = Date.now() - startTime;

      // Then
      expect(duration).toBeLessThan(200); // Should be fast due to parallel fetching
      expect(mockSupabase.rpc).toHaveBeenCalledTimes(1);
    });

    it('should handle partial data gracefully', async () => {
      // Given - Some data missing
      mockSupabase.rpc.mockResolvedValue({
        data: {
          profile: { id: userId },
          recent_workouts: [],
          recent_meals: null, // Missing meals
          recent_activities: [],
          goals: [],
        },
        error: null,
      });

      // When
      const context = await contextBuilder.buildContext(userId);

      // Then
      expect(context.profile).toBeDefined();
      expect(context.recentMeals).toEqual([]); // Should default to empty array
      expect(context.workoutPatterns).toEqual([]);
    });
  });

  describe('getMemoryFacts', () => {
    it('should retrieve memory facts with limit', async () => {
      // Given
      const mockFacts = [
        { id: '1', content: 'Fact 1', confidence: 0.9 },
        { id: '2', content: 'Fact 2', confidence: 0.8 },
      ];

      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: mockFacts,
        error: null,
      });

      // When
      const facts = await contextBuilder.getMemoryFacts(userId, 20);

      // Then
      expect(facts).toHaveLength(2);
      expect(mockSupabase.from).toHaveBeenCalledWith('user_memory_facts');
      expect(mockSupabase.from().limit).toHaveBeenCalledWith(20);
    });

    it('should filter by minimum confidence', async () => {
      // Given
      const allFacts = [
        { id: '1', content: 'High confidence', confidence: 0.9 },
        { id: '2', content: 'Low confidence', confidence: 0.3 },
      ];

      mockSupabase.from().select().eq().gte().order().limit.mockResolvedValue({
        data: allFacts.filter(f => f.confidence >= 0.5),
        error: null,
      });

      // When
      const facts = await contextBuilder.getMemoryFacts(userId, 20, 0.5);

      // Then
      expect(facts).toHaveLength(1);
      expect(facts[0].confidence).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('getRecentConversationSummaries', () => {
    it('should retrieve recent conversation summaries', async () => {
      // Given
      const mockSummaries = [
        {
          id: '1',
          summary: 'Discussed workout plans',
          key_topics: ['workout', 'planning'],
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: mockSummaries,
        error: null,
      });

      // When
      const summaries = await contextBuilder.getRecentConversationSummaries(userId, 5);

      // Then
      expect(summaries).toHaveLength(1);
      expect(summaries[0].summary).toContain('workout');
    });
  });

  describe('getPreferenceProfile', () => {
    it('should retrieve or build preference profile', async () => {
      // Given - No existing profile
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      // Mock facts for building profile
      mockSupabase.from().select().eq().order().limit.mockResolvedValue({
        data: [
          { type: 'preference', content: 'Morning workouts', metadata: { time: 'morning' } },
          { type: 'constraint', content: 'Bad knee', metadata: { body_part: 'knee' } },
        ],
        error: null,
      });

      // When
      const profile = await contextBuilder.getPreferenceProfile(userId);

      // Then
      expect(profile).toBeDefined();
      expect(profile.userId).toBe(userId);
      expect(profile.workoutPreferences).toBeDefined();
      expect(profile.constraints).toBeDefined();
    });
  });

  describe('computeLongTermTrends', () => {
    it('should calculate workout frequency trend', async () => {
      // Given
      const context = {
        recentWorkouts: [
          // Week 1: 3 workouts
          { completed_at: new Date('2024-01-01') },
          { completed_at: new Date('2024-01-03') },
          { completed_at: new Date('2024-01-05') },
          // Week 2: 4 workouts
          { completed_at: new Date('2024-01-08') },
          { completed_at: new Date('2024-01-10') },
          { completed_at: new Date('2024-01-12') },
          { completed_at: new Date('2024-01-14') },
          // Week 3: 5 workouts
          { completed_at: new Date('2024-01-15') },
          { completed_at: new Date('2024-01-17') },
          { completed_at: new Date('2024-01-19') },
          { completed_at: new Date('2024-01-20') },
          { completed_at: new Date('2024-01-21') },
        ],
      };

      // When
      const trends = contextBuilder.computeLongTermTrends(context as any);

      // Then
      expect(trends.workoutFrequencyTrend.direction).toBe('increasing');
      expect(trends.workoutFrequencyTrend.changeRate).toBeGreaterThan(0);
    });

    it('should calculate nutrition adherence trend', async () => {
      // Given
      const context = {
        recentMeals: [
          // Consistent calorie tracking
          { calories: 2000, logged_at: new Date('2024-01-01') },
          { calories: 2100, logged_at: new Date('2024-01-02') },
          { calories: 1950, logged_at: new Date('2024-01-03') },
        ],
        goals: [
          { type: 'nutrition', target_calories: 2000 }
        ],
      };

      // When
      const trends = contextBuilder.computeLongTermTrends(context as any);

      // Then
      expect(trends.nutritionAdherenceTrend.direction).toBe('stable');
      expect(trends.nutritionAdherenceTrend.confidence).toBeGreaterThan(0.7);
    });

    it('should calculate activity consistency', async () => {
      // Given - Regular activities
      const context = {
        recentActivities: Array(30).fill(null).map((_, i) => ({
          start_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Daily activities
        })),
      };

      // When
      const trends = contextBuilder.computeLongTermTrends(context as any);

      // Then
      expect(trends.activityConsistency).toBeGreaterThan(0.8); // High consistency
    });
  });
});

// Helper function to create mock context data
function mockContextData() {
  return {
    profile: { id: 'user-1', name: 'Test User' },
    recent_workouts: Array(50).fill({ id: 'workout' }),
    recent_meals: Array(100).fill({ id: 'meal' }),
    recent_activities: Array(100).fill({ id: 'activity' }),
    goals: [{ id: 'goal-1' }],
    workout_patterns: [],
    nutrition_patterns: [],
  };
}