/**
 * Unit tests for Memory Extractor
 * These tests are written before implementation (TDD - Red phase)
 */

import { MemoryExtractor } from '@/lib/ai/memory-extractor';
import {
  ExtractedFact,
  ConversationSummary,
  MemoryFactType,
  ConversationSentiment,
} from '@/types/memory';

describe('MemoryExtractor', () => {
  let extractor: MemoryExtractor;
  const userId = 'test-user-123';

  beforeEach(() => {
    extractor = new MemoryExtractor();
  });

  describe('extractFactsFromConversation', () => {
    it('should extract preference facts from conversation', async () => {
      // Given
      const messages = [
        { role: 'user', content: 'I prefer morning workouts' },
        { role: 'assistant', content: 'Great! Morning workouts noted.' },
        { role: 'user', content: 'I hate running but love cycling' }
      ];

      // When
      const facts = await extractor.extractFactsFromConversation(messages, userId);

      // Then
      expect(facts).toHaveLength(2);
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: 'preference',
          content: expect.stringContaining('morning workout'),
          confidence: expect.any(Number),
        })
      );
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: 'preference',
          content: expect.stringContaining('cycling'),
          confidence: expect.any(Number),
        })
      );
    });

    it('should extract goal facts from conversation', async () => {
      // Given
      const messages = [
        { role: 'user', content: 'I want to bench press 225 lbs by December' },
        { role: 'user', content: 'My goal is to run a marathon next year' }
      ];

      // When
      const facts = await extractor.extractFactsFromConversation(messages, userId);

      // Then
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: 'goal',
          content: expect.stringContaining('bench press 225'),
          metadata: expect.objectContaining({
            exercise: 'bench_press',
            target: 225,
            unit: 'lbs',
          }),
        })
      );
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: 'goal',
          content: expect.stringContaining('marathon'),
        })
      );
    });

    it('should extract constraint facts (injuries, limitations)', async () => {
      // Given
      const messages = [
        { role: 'user', content: 'I have a bad knee so I avoid jumping exercises' },
        { role: 'user', content: "I'm allergic to peanuts" }
      ];

      // When
      const facts = await extractor.extractFactsFromConversation(messages, userId);

      // Then
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: 'constraint',
          content: expect.stringContaining('knee'),
          metadata: expect.objectContaining({
            body_part: 'knee',
            avoid: expect.arrayContaining(['jumping']),
          }),
        })
      );
      expect(facts).toContainEqual(
        expect.objectContaining({
          type: 'constraint',
          content: expect.stringContaining('peanuts'),
          confidence: 1.0, // Allergies should have max confidence
        })
      );
    });

    it('should assign appropriate confidence scores', async () => {
      // Given
      const messages = [
        { role: 'user', content: 'I think I prefer morning workouts' }, // Uncertain
        { role: 'user', content: 'I absolutely hate burpees' }, // Certain
        { role: 'user', content: 'I might be able to workout 4 times a week' } // Very uncertain
      ];

      // When
      const facts = await extractor.extractFactsFromConversation(messages, userId);

      // Then
      const morningPref = facts.find(f => f.content.includes('morning'));
      const burpeeHate = facts.find(f => f.content.includes('burpees'));
      const frequency = facts.find(f => f.content.includes('4 times'));

      expect(morningPref?.confidence).toBeLessThan(0.7);
      expect(burpeeHate?.confidence).toBeGreaterThan(0.9);
      expect(frequency?.confidence).toBeLessThan(0.6);
    });

    it('should handle empty or invalid conversations', async () => {
      // Given
      const emptyMessages: any[] = [];
      const invalidMessages = [
        { role: 'user', content: '```python\ncode example\n```' },
        { role: 'user', content: '🏋️‍♂️💪🔥' }
      ];

      // When
      const emptyFacts = await extractor.extractFactsFromConversation(emptyMessages, userId);
      const invalidFacts = await extractor.extractFactsFromConversation(invalidMessages, userId);

      // Then
      expect(emptyFacts).toEqual([]);
      expect(invalidFacts).toEqual([]);
    });
  });

  describe('summarizeConversation', () => {
    it('should generate accurate conversation summary', async () => {
      // Given
      const messages = [
        { role: 'user', content: 'Can you help me create a workout plan?' },
        { role: 'assistant', content: 'Of course! What are your goals?' },
        { role: 'user', content: 'I want to build muscle and lose fat' },
        { role: 'assistant', content: 'I recommend a 4-day split...' },
        { role: 'user', content: "Sounds good, I'll start Monday" }
      ];

      // When
      const summary = await extractor.summarizeConversation(messages, userId);

      // Then
      expect(summary.summary).toContain('workout plan');
      expect(summary.keyTopics).toContain('workout_planning');
      expect(summary.keyTopics).toContain('muscle_building');
      expect(summary.actionItems).toContainEqual(
        expect.stringContaining('Monday')
      );
      expect(summary.sentiment).toBe('positive');
    });

    it('should extract action items from conversation', async () => {
      // Given
      const messages = [
        { role: 'user', content: "I'll increase my protein to 150g per day" },
        { role: 'user', content: "I'll try the workout you suggested tomorrow" },
        { role: 'user', content: "I need to buy resistance bands" }
      ];

      // When
      const summary = await extractor.summarizeConversation(messages, userId);

      // Then
      expect(summary.actionItems).toHaveLength(3);
      expect(summary.actionItems).toContainEqual(
        expect.stringContaining('protein')
      );
      expect(summary.actionItems).toContainEqual(
        expect.stringContaining('workout')
      );
      expect(summary.actionItems).toContainEqual(
        expect.stringContaining('resistance bands')
      );
    });

    it('should detect conversation sentiment', async () => {
      // Test positive sentiment
      const positiveMessages = [
        { role: 'user', content: "Great! I'm excited to start!" },
        { role: 'user', content: 'This is exactly what I needed, thank you!' }
      ];

      const positiveSummary = await extractor.summarizeConversation(positiveMessages, userId);
      expect(positiveSummary.sentiment).toBe('positive');

      // Test frustrated sentiment
      const frustratedMessages = [
        { role: 'user', content: "I'm not seeing any progress" },
        { role: 'user', content: 'This is too hard, nothing is working' }
      ];

      const frustratedSummary = await extractor.summarizeConversation(frustratedMessages, userId);
      expect(frustratedSummary.sentiment).toBe('frustrated');
    });
  });

  describe('extractActionItems', () => {
    it('should identify commitments and plans', async () => {
      // Given
      const messages = [
        { role: 'user', content: "I'll wake up at 6 AM for workouts" },
        { role: 'user', content: "Going to meal prep on Sundays" },
        { role: 'user', content: "I should probably drink more water" }, // Vague
        { role: 'user', content: "Will track my calories starting today" }
      ];

      // When
      const actionItems = await extractor.extractActionItems(messages);

      // Then
      expect(actionItems).toHaveLength(3); // Should exclude vague commitment
      expect(actionItems).toContainEqual(
        expect.stringContaining('6 AM')
      );
      expect(actionItems).toContainEqual(
        expect.stringContaining('meal prep')
      );
      expect(actionItems).toContainEqual(
        expect.stringContaining('track')
      );
    });
  });

  describe('analyzeSentiment', () => {
    it('should correctly identify sentiment patterns', async () => {
      const testCases: Array<[any[], ConversationSentiment]> = [
        [
          [{ role: 'user', content: "I'm making great progress!" }],
          'motivated'
        ],
        [
          [{ role: 'user', content: "I don't know if this is working" }],
          'neutral'
        ],
        [
          [{ role: 'user', content: "I'm struggling and feel like giving up" }],
          'frustrated'
        ],
        [
          [{ role: 'user', content: 'Thanks for the help!' }],
          'positive'
        ]
      ];

      for (const [messages, expectedSentiment] of testCases) {
        const sentiment = await extractor.analyzeSentiment(messages);
        expect(sentiment).toBe(expectedSentiment);
      }
    });
  });
});