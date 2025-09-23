/**
 * Memory Extractor for AI Coach
 * Extracts facts, preferences, and insights from conversations
 */

import { OpenAI } from 'openai';
import {
  ExtractedFact,
  ConversationSummary,
  MemoryFactType,
  ConversationSentiment,
  IMemoryExtractor,
} from '@/types/memory';

export class MemoryExtractor implements IMemoryExtractor {
  private openai: OpenAI | null = null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async extractFactsFromConversation(
    messages: any[],
    userId: string
  ): Promise<ExtractedFact[]> {
    if (!messages || messages.length === 0) {
      return [];
    }

    // Filter out non-conversational content
    const validMessages = messages.filter(msg =>
      msg.content &&
      msg.content.trim() &&
      !msg.content.match(/^```[\s\S]*```$/) && // Code blocks
      !msg.content.match(/^[\u{1F300}-\u{1F9FF}]+$/u) // Only emojis
    );

    if (validMessages.length === 0) {
      return [];
    }

    // If OpenAI is not available, use rule-based extraction
    if (!this.openai) {
      return this.extractFactsRuleBased(validMessages);
    }

    try {
      const conversationText = validMessages
        .map(m => `${m.role}: ${m.content}`)
        .join('\n');

      const response = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'system',
            content: `Extract important facts about the user from this fitness coaching conversation.
Focus on:
- Preferences (likes/dislikes)
- Goals and objectives
- Constraints (injuries, limitations, allergies)
- Achievements and PRs
- Routines and habits

Return as JSON array with this structure:
[{
  "type": "preference|goal|constraint|achievement|routine",
  "content": "brief description",
  "confidence": 0.0-1.0,
  "metadata": { relevant key-value pairs }
}]

Only return the JSON array, no other text.`,
          },
          {
            role: 'user',
            content: conversationText,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content || '[]';
      const facts = JSON.parse(content);

      return facts.map((fact: any) => ({
        type: fact.type as MemoryFactType,
        content: fact.content,
        confidence: fact.confidence || 0.8,
        metadata: fact.metadata || {},
      }));
    } catch (error) {
      console.error('Error extracting facts with AI:', error);
      return this.extractFactsRuleBased(validMessages);
    }
  }

  private extractFactsRuleBased(messages: any[]): ExtractedFact[] {
    const facts: ExtractedFact[] = [];

    for (const msg of messages) {
      if (msg.role !== 'user') continue;

      const content = msg.content.toLowerCase();

      // Preferences
      if (content.includes('prefer') || content.includes('like') || content.includes('love')) {
        const confidence = this.getConfidenceFromText(content);
        facts.push({
          type: 'preference',
          content: this.cleanFactContent(msg.content),
          confidence,
          metadata: this.extractMetadata(content),
        });
      }

      // Goals
      if (content.includes('want to') || content.includes('goal') || content.includes('by december') || content.includes('by ')) {
        facts.push({
          type: 'goal',
          content: this.cleanFactContent(msg.content),
          confidence: 0.85,
          metadata: this.extractGoalMetadata(content),
        });
      }

      // Constraints
      if (content.includes('injur') || content.includes('avoid') || content.includes('allerg') || content.includes('bad')) {
        const isAllergy = content.includes('allerg');
        facts.push({
          type: 'constraint',
          content: this.cleanFactContent(msg.content),
          confidence: isAllergy ? 1.0 : 0.9,
          metadata: this.extractConstraintMetadata(content),
        });
      }

      // Dislikes (strong preferences)
      if (content.includes('hate') || content.includes('absolutely')) {
        facts.push({
          type: 'preference',
          content: this.cleanFactContent(msg.content),
          confidence: content.includes('absolutely') ? 0.95 : 0.9,
          metadata: { strong: true },
        });
      }
    }

    return facts;
  }

  private getConfidenceFromText(text: string): number {
    // Words indicating uncertainty
    if (text.includes('think') || text.includes('maybe') || text.includes('might')) {
      return 0.6;
    }
    if (text.includes('probably') || text.includes('usually')) {
      return 0.7;
    }
    if (text.includes('definitely') || text.includes('absolutely') || text.includes('always')) {
      return 0.95;
    }
    return 0.8; // Default confidence
  }

  private cleanFactContent(content: string): string {
    // Clean up the content for storage
    return content
      .replace(/[.!?]+$/, '') // Remove trailing punctuation
      .replace(/^(i |I'm |I am )/i, '') // Remove first-person pronouns
      .toLowerCase()
      .replace(/\b(morning|afternoon|evening|night)\b/gi, (match) => match.toLowerCase())
      .replace(/prefer(s)?/i, 'prefers')
      .replace(/hate(s)?/i, 'dislikes')
      .trim();
  }

  private extractMetadata(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Time preferences
    if (content.includes('morning')) metadata.time = 'morning';
    if (content.includes('evening')) metadata.time = 'evening';
    if (content.includes('afternoon')) metadata.time = 'afternoon';

    // Activities
    if (content.includes('running')) metadata.activity = 'running';
    if (content.includes('cycling')) metadata.activity = 'cycling';
    if (content.includes('workout')) metadata.activity = 'workout';

    return metadata;
  }

  private extractGoalMetadata(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract numbers and units
    const numberMatch = content.match(/(\d+)\s*(lbs?|kg|pounds?|kilos?)/i);
    if (numberMatch) {
      metadata.target = parseInt(numberMatch[1]);
      metadata.unit = numberMatch[2].toLowerCase().replace(/s$/, '');
    }

    // Extract exercise names
    if (content.includes('bench press')) metadata.exercise = 'bench_press';
    if (content.includes('squat')) metadata.exercise = 'squat';
    if (content.includes('deadlift')) metadata.exercise = 'deadlift';
    if (content.includes('marathon')) metadata.exercise = 'marathon';

    return metadata;
  }

  private extractConstraintMetadata(content: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Body parts
    if (content.includes('knee')) metadata.body_part = 'knee';
    if (content.includes('back')) metadata.body_part = 'back';
    if (content.includes('shoulder')) metadata.body_part = 'shoulder';

    // Activities to avoid
    if (content.includes('jumping')) {
      metadata.avoid = metadata.avoid || [];
      metadata.avoid.push('jumping');
    }
    if (content.includes('running')) {
      metadata.avoid = metadata.avoid || [];
      metadata.avoid.push('running');
    }

    // Allergies
    if (content.includes('peanut')) metadata.allergen = 'peanuts';
    if (content.includes('dairy')) metadata.allergen = 'dairy';
    if (content.includes('gluten')) metadata.allergen = 'gluten';

    return metadata;
  }

  async summarizeConversation(
    messages: any[],
    userId: string
  ): Promise<ConversationSummary> {
    const keyTopics = this.extractKeyTopics(messages);
    const actionItems = await this.extractActionItems(messages);
    const sentiment = await this.analyzeSentiment(messages);

    // Generate summary
    const summary = this.generateSummary(messages, keyTopics);

    return {
      id: '', // Will be set when stored
      userId,
      conversationId: '', // Will be set when stored
      summary,
      keyTopics,
      extractedFacts: [], // Will be populated when facts are stored
      actionItems,
      sentiment,
      createdAt: new Date(),
    };
  }

  async extractActionItems(messages: any[]): Promise<string[]> {
    const actionItems: string[] = [];

    for (const msg of messages) {
      if (msg.role !== 'user') continue;

      const content = msg.content;

      // Look for commitment patterns
      if (
        content.match(/I'?ll\s+/i) ||
        content.match(/going to\s+/i) ||
        content.match(/will\s+/i) ||
        content.match(/starting\s+(today|tomorrow|monday)/i)
      ) {
        // Skip vague commitments
        if (!content.includes('should') && !content.includes('probably')) {
          actionItems.push(this.formatActionItem(content));
        }
      }
    }

    return actionItems;
  }

  private formatActionItem(content: string): string {
    return content
      .replace(/^(I'?ll|I will|I'm going to)\s+/i, '')
      .replace(/\.$/, '')
      .trim()
      .charAt(0).toUpperCase() + content.slice(1);
  }

  async analyzeSentiment(messages: any[]): Promise<ConversationSentiment> {
    const sentimentScores = {
      positive: 0,
      neutral: 0,
      frustrated: 0,
      motivated: 0,
    };

    for (const msg of messages) {
      if (msg.role !== 'user') continue;

      const content = msg.content.toLowerCase();

      // Positive indicators
      if (content.includes('great') || content.includes('thank') || content.includes('excited')) {
        sentimentScores.positive++;
      }

      // Motivated indicators
      if (content.includes('progress') || content.includes('can\'t wait') || content.includes('let\'s')) {
        sentimentScores.motivated++;
      }

      // Frustrated indicators
      if (content.includes('struggling') || content.includes('giving up') || content.includes('frustrated') || content.includes('not working')) {
        sentimentScores.frustrated++;
      }

      // Neutral indicators
      if (content.includes('don\'t know') || content.includes('maybe') || content.includes('not sure')) {
        sentimentScores.neutral++;
      }
    }

    // Determine dominant sentiment
    const maxScore = Math.max(...Object.values(sentimentScores));
    if (maxScore === 0) return 'neutral';

    for (const [sentiment, score] of Object.entries(sentimentScores)) {
      if (score === maxScore) {
        return sentiment as ConversationSentiment;
      }
    }

    return 'neutral';
  }

  private extractKeyTopics(messages: any[]): string[] {
    const topics = new Set<string>();

    for (const msg of messages) {
      const content = msg.content.toLowerCase();

      // Workout related
      if (content.includes('workout') || content.includes('exercise')) {
        topics.add('workout_planning');
      }
      if (content.includes('muscle') || content.includes('strength')) {
        topics.add('muscle_building');
      }
      if (content.includes('cardio') || content.includes('running')) {
        topics.add('cardio');
      }

      // Nutrition related
      if (content.includes('diet') || content.includes('nutrition') || content.includes('meal')) {
        topics.add('nutrition');
      }
      if (content.includes('protein') || content.includes('calories')) {
        topics.add('macros');
      }

      // Goal related
      if (content.includes('lose') && (content.includes('weight') || content.includes('fat'))) {
        topics.add('fat_loss');
      }
      if (content.includes('gain') && content.includes('muscle')) {
        topics.add('muscle_gain');
      }
    }

    return Array.from(topics);
  }

  private generateSummary(messages: any[], topics: string[]): string {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) return 'No conversation content';

    const mainTopic = topics[0] || 'general fitness';
    const messageCount = userMessages.length;

    return `Discussed ${mainTopic} with ${messageCount} user messages. Topics covered: ${topics.join(', ')}.`;
  }
}