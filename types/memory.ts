/**
 * Type definitions for AI Coach Memory Enhancement System
 */

// ============= Core Memory Types =============

export type MemoryFactType = 'preference' | 'goal' | 'constraint' | 'achievement' | 'routine';

export type FactSource = 'conversation' | 'explicit_input' | 'inferred';

export type ConversationSentiment = 'positive' | 'neutral' | 'frustrated' | 'motivated';

export interface MemoryFact {
  id: string;
  userId: string;
  factType: MemoryFactType;
  content: string;
  confidence: number; // 0.0 to 1.0
  source: FactSource;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
}

export interface ConversationSummary {
  id: string;
  userId: string;
  conversationId: string;
  summary: string;
  keyTopics: string[];
  extractedFacts: string[]; // Fact IDs
  actionItems: string[];
  sentiment: ConversationSentiment;
  createdAt: Date;
}

export interface PreferenceProfile {
  userId: string;
  workoutPreferences: WorkoutPreferences;
  nutritionPreferences: NutritionPreferences;
  communicationStyle: CommunicationStyle;
  constraints: UserConstraints;
  motivators: string[];
  coachingNotes?: string;
  updatedAt: Date;
}

// ============= Preference Sub-types =============

export interface WorkoutPreferences {
  preferredTime?: 'early_morning' | 'morning' | 'afternoon' | 'evening' | 'night';
  preferredDays?: string[]; // ['monday', 'wednesday', 'friday']
  preferredDuration?: number; // minutes
  preferredIntensity?: 'low' | 'moderate' | 'high';
  favoriteExercises?: string[];
  avoidedExercises?: string[];
  preferredEnvironment?: 'home' | 'gym' | 'outdoor';
  equipmentAvailable?: string[];
  timeConfidence?: number; // Confidence in time preference
}

export interface NutritionPreferences {
  dietaryRestrictions?: string[]; // ['vegetarian', 'gluten-free', 'dairy-free']
  allergies?: string[];
  preferredMealTimes?: Record<string, string>; // { breakfast: '7:00', lunch: '12:00' }
  dislikedFoods?: string[];
  favoriteHealthyFoods?: string[];
  mealPrepPreference?: boolean;
  trackingDetail?: 'minimal' | 'moderate' | 'detailed';
}

export interface CommunicationStyle {
  preferredTone?: 'encouraging' | 'direct' | 'gentle' | 'tough_love';
  detailLevel?: 'concise' | 'moderate' | 'detailed';
  motivationStyle?: 'positive_reinforcement' | 'challenge_based' | 'progress_focused';
  reminderFrequency?: 'daily' | 'weekly' | 'as_needed' | 'never';
}

export interface UserConstraints {
  injuries?: InjuryConstraint[];
  medicalConditions?: string[];
  timeConstraints?: TimeConstraint[];
  equipmentLimitations?: string[];
  mobilityRestrictions?: string[];
}

export interface InjuryConstraint {
  bodyPart: string;
  severity: 'mild' | 'moderate' | 'severe';
  restrictions: string[];
  dateReported: Date;
  isHealed?: boolean;
}

export interface TimeConstraint {
  dayOfWeek: string;
  unavailableHours: string[]; // ['9-17', '20-22']
  reason?: string;
}

// ============= Pattern Types =============

export interface WorkoutPattern {
  dayOfWeek: number;
  hourOfDay: number;
  frequency: number;
  avgDuration: number;
  workoutTypes: string[];
}

export interface NutritionPattern {
  mealType: string;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  mealCount: number;
  timePreferences: string[];
}

export interface LongTermTrends {
  workoutFrequencyTrend: TrendData;
  strengthProgressTrend: TrendData;
  nutritionAdherenceTrend: TrendData;
  activityConsistency: number; // 0.0 to 1.0
}

export interface TrendData {
  direction: 'increasing' | 'stable' | 'decreasing';
  changeRate: number; // Percentage change
  confidence: number;
  periodDays: number;
}

// ============= Context Types =============

export interface EnhancedUserContext {
  // Base context (existing)
  profile: any; // Use existing UserProfile type
  recentWorkouts: any[]; // Use existing WorkoutCompletion type
  recentMeals: any[]; // Use existing Meal type
  recentActivities: any[]; // Use existing Activity type
  goals: any[]; // Use existing Goal type

  // Enhanced context (new)
  workoutPatterns: WorkoutPattern[];
  nutritionPatterns: NutritionPattern[];
  memoryFacts: MemoryFact[];
  conversationSummaries: ConversationSummary[];
  preferenceProfile: PreferenceProfile;
  longTermTrends: LongTermTrends;
}

export interface CompressedContext {
  // Core data
  profile: any;
  currentGoals: any[];

  // Summaries instead of full data
  workoutSummary: string;
  nutritionSummary: string;
  activitySummary: string;

  // Selected recent data
  recentWorkouts: any[]; // Limited to most recent
  todaysMeals: any[];

  // Key extracted info
  relevantFacts: MemoryFact[];
  keyPreferences: Partial<PreferenceProfile>;
  trends: LongTermTrends;
}

// ============= Extraction Types =============

export interface ExtractedFact {
  type: MemoryFactType;
  content: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface ExtractionResult {
  facts: ExtractedFact[];
  summary: string;
  topics: string[];
  actionItems: string[];
  sentiment: ConversationSentiment;
}

export interface MemoryExtractionRequest {
  conversationId: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  userId: string;
  extractFacts?: boolean;
  generateSummary?: boolean;
}

// ============= Service Interfaces =============

export interface IMemoryExtractor {
  extractFactsFromConversation(
    messages: any[],
    userId: string
  ): Promise<ExtractedFact[]>;

  summarizeConversation(
    messages: any[],
    userId: string
  ): Promise<ConversationSummary>;

  extractActionItems(
    messages: any[]
  ): Promise<string[]>;

  analyzeSentiment(
    messages: any[]
  ): Promise<ConversationSentiment>;
}

export interface IContextBuilder {
  buildContext(userId: string): Promise<EnhancedUserContext>;

  getMemoryFacts(userId: string, limit?: number): Promise<MemoryFact[]>;

  getRecentConversationSummaries(
    userId: string,
    limit?: number
  ): Promise<ConversationSummary[]>;

  getPreferenceProfile(userId: string): Promise<PreferenceProfile>;

  computeLongTermTrends(context: any): LongTermTrends;
}

export interface IContextCompressor {
  compressContext(
    context: EnhancedUserContext,
    maxTokens?: number
  ): Promise<CompressedContext>;

  prioritizeContext(context: EnhancedUserContext): any;

  summarizeWorkouts(workouts: any[]): string;

  summarizeNutrition(meals: any[]): string;

  summarizeActivities(activities: any[]): string;

  selectRelevantFacts(facts: MemoryFact[], query?: string): MemoryFact[];
}

export interface IPreferenceProfileBuilder {
  buildProfile(facts: MemoryFact[]): Promise<PreferenceProfile>;

  updateProfile(
    userId: string,
    updates: Partial<PreferenceProfile>
  ): Promise<PreferenceProfile>;

  mergePreferences(
    existing: PreferenceProfile,
    newFacts: MemoryFact[]
  ): PreferenceProfile;

  inferPreferences(
    workouts: any[],
    meals: any[],
    activities: any[]
  ): Partial<PreferenceProfile>;
}

// ============= API Types =============

export interface StoreMemoryFactRequest {
  userId: string;
  factType: MemoryFactType;
  content: string;
  confidence?: number;
  source?: FactSource;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

export interface GetMemoryFactsRequest {
  userId: string;
  factTypes?: MemoryFactType[];
  minConfidence?: number;
  limit?: number;
  includeExpired?: boolean;
}

export interface UpdateMemoryFactRequest {
  factId: string;
  updates: {
    confidence?: number;
    isActive?: boolean;
    metadata?: Record<string, any>;
    expiresAt?: Date;
  };
}

export interface ExtractMemoryRequest {
  conversationId: string;
  messages: any[];
  userId: string;
  autoStore?: boolean;
}

export interface GetEnhancedContextRequest {
  userId: string;
  includePatterns?: boolean;
  includeSummaries?: boolean;
  includeMemory?: boolean;
  includeTrends?: boolean;
  compress?: boolean;
  maxTokens?: number;
}

// ============= Response Types =============

export interface MemoryFactResponse {
  fact: MemoryFact;
  created: boolean;
}

export interface MemoryFactsListResponse {
  facts: MemoryFact[];
  total: number;
  hasMore: boolean;
}

export interface ExtractionResponse {
  extractedFacts: ExtractedFact[];
  summary?: ConversationSummary;
  storedFactIds?: string[];
  processingTimeMs: number;
}

export interface EnhancedContextResponse {
  context: EnhancedUserContext | CompressedContext;
  tokenCount: number;
  retrievalTimeMs: number;
  compressed: boolean;
}

export interface PreferenceProfileResponse {
  profile: PreferenceProfile;
  lastUpdated: Date;
  factCount: number;
}

// ============= Error Types =============

export class MemoryExtractionError extends Error {
  constructor(
    message: string,
    public readonly conversationId?: string,
    public readonly cause?: any
  ) {
    super(message);
    this.name = 'MemoryExtractionError';
  }
}

export class ContextRetrievalError extends Error {
  constructor(
    message: string,
    public readonly userId?: string,
    public readonly cause?: any
  ) {
    super(message);
    this.name = 'ContextRetrievalError';
  }
}

export class CompressionError extends Error {
  constructor(
    message: string,
    public readonly originalSize?: number,
    public readonly targetSize?: number
  ) {
    super(message);
    this.name = 'CompressionError';
  }
}

// ============= Configuration Types =============

export interface MemorySystemConfig {
  enableMemoryExtraction: boolean;
  enableConversationSummaries: boolean;
  enablePreferenceProfile: boolean;
  enableContextCompression: boolean;

  maxFactsPerUser: number;
  maxSummariesPerUser: number;
  factExpirationDays: number;
  minFactConfidence: number;

  contextRetrievalTimeoutMs: number;
  compressionMaxTokens: number;

  openAiModel?: string;
  openAiApiKey?: string;
}