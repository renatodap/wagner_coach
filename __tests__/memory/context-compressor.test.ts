/**
 * Unit tests for Context Compressor
 * These tests are written before implementation (TDD - Red phase)
 */

import { ContextCompressor } from '@/lib/ai/context-compressor';
import {
  EnhancedUserContext,
  CompressedContext,
  MemoryFact,
} from '@/types/memory';

describe('ContextCompressor', () => {
  let compressor: ContextCompressor;

  beforeEach(() => {
    compressor = new ContextCompressor();
  });

  describe('compressContext', () => {
    it('should compress context to stay under token limit', async () => {
      // Given - Large context that would exceed token limit
      const largeContext: EnhancedUserContext = {
        profile: { id: 'user-1', name: 'Test User' },
        recentWorkouts: generateWorkouts(100),
        recentMeals: generateMeals(200),
        recentActivities: generateActivities(150),
        goals: generateGoals(10),
        workoutPatterns: generatePatterns(20),
        nutritionPatterns: generateNutritionPatterns(10),
        memoryFacts: generateFacts(50),
        conversationSummaries: generateSummaries(20),
        preferenceProfile: generatePreferenceProfile(),
        longTermTrends: generateTrends(),
      };

      // When
      const compressed = await compressor.compressContext(largeContext, 4000);
      const tokenCount = countTokens(compressed);

      // Then
      expect(tokenCount).toBeLessThanOrEqual(4000);
      expect(compressed).toHaveProperty('workoutSummary');
      expect(compressed).toHaveProperty('nutritionSummary');
      expect(compressed).toHaveProperty('activitySummary');
      expect(compressed.recentWorkouts).toHaveLength(10); // Should limit to most recent
    });

    it('should preserve essential information during compression', async () => {
      // Given
      const context: EnhancedUserContext = {
        profile: { id: 'user-1', name: 'Test User', preferences: 'important' },
        recentWorkouts: generateWorkouts(50),
        recentMeals: generateMeals(100),
        recentActivities: [],
        goals: [
          { id: '1', name: 'Active goal', isActive: true },
          { id: '2', name: 'Inactive goal', isActive: false },
        ],
        memoryFacts: [
          { content: 'Critical fact', confidence: 0.95 } as MemoryFact,
          { content: 'Low confidence', confidence: 0.2 } as MemoryFact,
        ],
        workoutPatterns: [],
        nutritionPatterns: [],
        conversationSummaries: [],
        preferenceProfile: generatePreferenceProfile(),
        longTermTrends: generateTrends(),
      };

      // When
      const compressed = await compressor.compressContext(context);

      // Then
      expect(compressed.profile).toEqual(context.profile); // Profile preserved
      expect(compressed.currentGoals).toHaveLength(1); // Only active goal
      expect(compressed.currentGoals[0].name).toBe('Active goal');
      expect(compressed.relevantFacts).toContainEqual(
        expect.objectContaining({ confidence: 0.95 })
      );
      expect(compressed.relevantFacts).not.toContainEqual(
        expect.objectContaining({ confidence: 0.2 })
      );
    });
  });

  describe('prioritizeContext', () => {
    it('should prioritize recent and relevant information', async () => {
      // Given
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const context: EnhancedUserContext = {
        profile: { id: 'user-1' },
        recentWorkouts: [
          { id: '1', completed_at: today },
          { id: '2', completed_at: yesterday },
          { id: '3', completed_at: lastWeek },
        ],
        recentMeals: [
          { id: 'm1', logged_at: today },
          { id: 'm2', logged_at: yesterday },
        ],
        recentActivities: [],
        goals: [
          { id: 'g1', isActive: true, priority: 'high' },
          { id: 'g2', isActive: false },
        ],
        memoryFacts: generateFacts(30),
        workoutPatterns: [],
        nutritionPatterns: [],
        conversationSummaries: [],
        preferenceProfile: generatePreferenceProfile(),
        longTermTrends: generateTrends(),
      };

      // When
      const prioritized = compressor.prioritizeContext(context);

      // Then
      expect(prioritized.todaysMeals).toHaveLength(1);
      expect(prioritized.todaysMeals[0].id).toBe('m1');
      expect(prioritized.currentGoals).toHaveLength(1);
      expect(prioritized.currentGoals[0].priority).toBe('high');
      expect(prioritized.recentWorkouts[0].completed_at).toEqual(today);
    });
  });

  describe('summarizeWorkouts', () => {
    it('should create concise workout summary', async () => {
      // Given
      const workouts = [
        { type: 'strength', duration: 45, exercises: ['bench', 'squat'] },
        { type: 'cardio', duration: 30, exercises: ['running'] },
        { type: 'strength', duration: 50, exercises: ['deadlift', 'rows'] },
      ];

      // When
      const summary = compressor.summarizeWorkouts(workouts);

      // Then
      expect(summary).toContain('3 workouts');
      expect(summary).toContain('strength');
      expect(summary).toContain('cardio');
      expect(summary).toContain('average');
      expect(summary.length).toBeLessThan(500); // Should be concise
    });

    it('should identify workout patterns in summary', async () => {
      // Given - Consistent morning workouts
      const workouts = Array(10).fill(null).map((_, i) => ({
        type: 'strength',
        completed_at: new Date(`2024-01-${i + 1} 06:00`),
        duration: 45,
      }));

      // When
      const summary = compressor.summarizeWorkouts(workouts);

      // Then
      expect(summary).toContain('morning');
      expect(summary).toContain('consistent');
    });
  });

  describe('summarizeNutrition', () => {
    it('should create nutrition summary with averages', async () => {
      // Given
      const meals = [
        { type: 'breakfast', calories: 400, protein: 30, carbs: 40, fat: 15 },
        { type: 'lunch', calories: 600, protein: 40, carbs: 60, fat: 20 },
        { type: 'dinner', calories: 700, protein: 50, carbs: 70, fat: 25 },
        { type: 'snack', calories: 200, protein: 10, carbs: 25, fat: 8 },
      ];

      // When
      const summary = compressor.summarizeNutrition(meals);

      // Then
      expect(summary).toContain('1900'); // Total calories
      expect(summary).toContain('130'); // Total protein
      expect(summary).toContain('breakfast');
      expect(summary).toContain('lunch');
      expect(summary).toContain('dinner');
      expect(summary.length).toBeLessThan(400);
    });
  });

  describe('selectRelevantFacts', () => {
    it('should select facts based on confidence and relevance', async () => {
      // Given
      const facts: MemoryFact[] = [
        { id: '1', content: 'Loves squats', confidence: 0.95, factType: 'preference' } as MemoryFact,
        { id: '2', content: 'Maybe likes running', confidence: 0.3, factType: 'preference' } as MemoryFact,
        { id: '3', content: 'Injured knee', confidence: 0.9, factType: 'constraint' } as MemoryFact,
        { id: '4', content: 'Goal: Lose 10 lbs', confidence: 0.85, factType: 'goal' } as MemoryFact,
      ];

      // When
      const selected = compressor.selectRelevantFacts(facts);

      // Then
      expect(selected).toHaveLength(3); // Exclude low confidence
      expect(selected).not.toContainEqual(
        expect.objectContaining({ confidence: 0.3 })
      );
      expect(selected).toContainEqual(
        expect.objectContaining({ factType: 'constraint' }) // Always include constraints
      );
    });

    it('should prioritize facts relevant to query', async () => {
      // Given
      const facts: MemoryFact[] = [
        { id: '1', content: 'Prefers morning runs', confidence: 0.8, factType: 'preference' } as MemoryFact,
        { id: '2', content: 'Vegetarian diet', confidence: 0.9, factType: 'preference' } as MemoryFact,
        { id: '3', content: 'Bench press goal', confidence: 0.85, factType: 'goal' } as MemoryFact,
      ];

      const query = 'nutrition advice';

      // When
      const selected = compressor.selectRelevantFacts(facts, query);

      // Then
      expect(selected[0].content).toContain('Vegetarian'); // Most relevant to nutrition
    });
  });
});

// Helper functions
function generateWorkouts(count: number) {
  return Array(count).fill(null).map((_, i) => ({
    id: `workout-${i}`,
    completed_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    type: i % 2 === 0 ? 'strength' : 'cardio',
    duration: 30 + Math.random() * 30,
  }));
}

function generateMeals(count: number) {
  return Array(count).fill(null).map((_, i) => ({
    id: `meal-${i}`,
    logged_at: new Date(Date.now() - i * 6 * 60 * 60 * 1000),
    calories: 300 + Math.random() * 400,
    protein: 20 + Math.random() * 30,
  }));
}

function generateActivities(count: number) {
  return Array(count).fill(null).map((_, i) => ({
    id: `activity-${i}`,
    start_date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
  }));
}

function generateGoals(count: number) {
  return Array(count).fill(null).map((_, i) => ({
    id: `goal-${i}`,
    name: `Goal ${i}`,
    isActive: i < count / 2,
  }));
}

function generatePatterns(count: number) {
  return Array(count).fill(null).map((_, i) => ({
    dayOfWeek: i % 7,
    hourOfDay: 6 + (i % 12),
    frequency: Math.random() * 10,
    avgDuration: 30 + Math.random() * 30,
    workoutTypes: ['strength', 'cardio'],
  }));
}

function generateNutritionPatterns(count: number) {
  return Array(count).fill(null).map((_, i) => ({
    mealType: ['breakfast', 'lunch', 'dinner'][i % 3],
    avgCalories: 400 + Math.random() * 400,
    avgProtein: 20 + Math.random() * 30,
    avgCarbs: 30 + Math.random() * 40,
    avgFat: 10 + Math.random() * 20,
    mealCount: 10 + i,
    timePreferences: ['morning', 'afternoon'],
  }));
}

function generateFacts(count: number): MemoryFact[] {
  return Array(count).fill(null).map((_, i) => ({
    id: `fact-${i}`,
    userId: 'user-1',
    factType: ['preference', 'goal', 'constraint'][i % 3] as any,
    content: `Fact ${i}`,
    confidence: 0.5 + Math.random() * 0.5,
    source: 'conversation',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  }));
}

function generateSummaries(count: number) {
  return Array(count).fill(null).map((_, i) => ({
    id: `summary-${i}`,
    summary: `Summary ${i}`,
    keyTopics: ['topic1', 'topic2'],
    createdAt: new Date(),
  }));
}

function generatePreferenceProfile() {
  return {
    userId: 'user-1',
    workoutPreferences: {
      preferredTime: 'morning' as const,
      preferredDays: ['monday', 'wednesday', 'friday'],
    },
    nutritionPreferences: {
      dietaryRestrictions: ['vegetarian'],
    },
    communicationStyle: {
      preferredTone: 'encouraging' as const,
    },
    constraints: {},
    motivators: ['progress', 'health'],
    updatedAt: new Date(),
  };
}

function generateTrends() {
  return {
    workoutFrequencyTrend: {
      direction: 'increasing' as const,
      changeRate: 0.15,
      confidence: 0.8,
      periodDays: 30,
    },
    strengthProgressTrend: {
      direction: 'stable' as const,
      changeRate: 0.05,
      confidence: 0.7,
      periodDays: 30,
    },
    nutritionAdherenceTrend: {
      direction: 'stable' as const,
      changeRate: 0.02,
      confidence: 0.85,
      periodDays: 14,
    },
    activityConsistency: 0.75,
  };
}

function countTokens(obj: any): number {
  // Simple token estimation: ~4 chars per token
  const jsonString = JSON.stringify(obj);
  return Math.ceil(jsonString.length / 4);
}