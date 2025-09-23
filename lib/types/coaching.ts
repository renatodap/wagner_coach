/**
 * AI Coaching System Type Definitions
 * Comprehensive types for the AI coach feature
 */

// Core message types
export interface CoachMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  tokens?: number;
  model?: string;
  context?: string[];
  citations?: Citation[];
}

export interface Citation {
  type: 'workout' | 'exercise' | 'progress' | 'goal';
  id: string;
  reference: string;
}

// Conversation management
export interface Conversation {
  id: string;
  userId: string;
  messages: CoachMessage[];
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: ConversationMetadata;
}

export interface ConversationMetadata {
  topic?: string;
  tags?: string[];
  summary?: string;
  lastActive?: Date;
}

// Embedding types
export interface Embedding {
  id: string;
  vector: number[];
  dimensions: 768;
  metadata: EmbeddingMetadata;
}

export interface EmbeddingMetadata {
  userId: string;
  contentType: ContentType;
  contentId: string;
  createdAt: Date;
}

export type ContentType =
  | 'workout'
  | 'goal'
  | 'conversation'
  | 'progress'
  | 'exercise'
  | 'achievement';

// Context types for RAG
export interface UserContext {
  userId: string;
  profile: ProfileContext;
  workouts: WorkoutContext;
  progress: ProgressContext;
  conversations: ConversationContext;
  goals?: GoalContext[];
  capabilities?: CapabilityContext;
  limitations?: LimitationContext;
  nutritionStats?: any;
  recentMeals?: any[];
  nutritionGoals?: any;
  dietaryPreferences?: any;
}

export interface ProfileContext {
  goal: 'build_muscle' | 'lose_weight' | 'gain_strength' | string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  preferences: UserPreferences;
  createdAt: Date;
  primaryGoal?: string;
  aboutMe?: string;
  focusAreas?: string[];
}

export interface UserPreferences {
  workoutDays: string[];
  workoutTime?: string;
  equipment: string[];
  injuries?: string[];
  limitations?: string[];
  motivationFactors?: string[];
  trainingStyle?: string | null;
}

export interface WorkoutContext {
  recent: RecentWorkout[];
  favorites: FavoriteWorkout[];
  stats: WorkoutStats;
  patterns: WorkoutPattern[];
  stravaActivities?: StravaActivity[];
}

export interface StravaActivity {
  id: string;
  name: string;
  activity_type: string;
  sport_type?: string;
  start_date: Date;
  duration_seconds?: number;
  distance_meters?: number;
  elevation_gain?: number;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  description?: string;
}

export interface RecentWorkout {
  id: string;
  name: string;
  type: string;
  completedAt: Date;
  duration: number;
  exercises: ExercisePerformance[];
  notes?: string;
  rating?: number;
}

export interface ExercisePerformance {
  name: string;
  sets: SetPerformance[];
  personalRecord?: boolean;
  notes?: string;
}

export interface SetPerformance {
  reps: number;
  weight?: number;
  rpe?: number;
}

export interface FavoriteWorkout {
  id: string;
  name: string;
  type: string;
  completionCount: number;
  averageRating: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  currentStreak: number;
  weeklyAverage: number;
  favoriteExercises: string[];
  strongestLifts: StrongestLift[];
}

export interface StrongestLift {
  exercise: string;
  oneRepMax: number;
  lastUpdated: Date;
}

export interface WorkoutPattern {
  type: 'frequency' | 'split' | 'progression';
  pattern: string;
  confidence: number;
}

export interface ProgressContext {
  milestones: Milestone[];
  trends: ProgressTrend[];
  personalRecords: PersonalRecord[];
}

export interface Milestone {
  type: string;
  achievement: string;
  date: Date;
  value?: number;
}

export interface ProgressTrend {
  metric: 'strength' | 'volume' | 'consistency' | 'endurance';
  direction: 'improving' | 'maintaining' | 'declining';
  rate: number;
  period: string;
}

export interface PersonalRecord {
  exercise: string;
  type: 'weight' | 'reps' | 'volume' | 'time';
  value: number;
  previousValue?: number;
  achievedAt: Date;
}

export interface ConversationContext {
  topics: string[];
  lastInteraction: Date;
  sessionCount: number;
  averageLength: number;
}

// API request/response types
export interface ChatRequest {
  message: string;
  conversationId?: string;
  context?: Partial<UserContext>;
  stream?: boolean;
}

export interface ChatResponse {
  message: CoachMessage;
  conversationId: string;
  suggestions?: string[];
  citations?: Citation[];
}

export interface EmbeddingRequest {
  content: string;
  contentType: ContentType;
  metadata?: Record<string, unknown>;
}

export interface EmbeddingResponse {
  embedding: number[];
  id: string;
  stored: boolean;
}

export interface SearchRequest {
  query: string;
  userId: string;
  limit?: number;
  threshold?: number;
  contentTypes?: ContentType[];
}

export interface SearchResult {
  id: string;
  content: string;
  contentType: ContentType;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface SearchResponse {
  results: SearchResult[];
  query: string;
  processingTime: number;
}

// Quick action types
export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: ActionCategory;
}

export type ActionCategory =
  | 'analysis'
  | 'planning'
  | 'motivation'
  | 'technique'
  | 'recovery';

// Streaming types
export interface StreamChunk {
  type: 'text' | 'metadata' | 'error' | 'done';
  content?: string;
  metadata?: Record<string, unknown>;
  error?: StreamError;
}

export interface StreamError {
  code: string;
  message: string;
  recoverable: boolean;
}

// Database schema types
export interface AIConversationRow {
  id: string;
  user_id: string;
  messages: CoachMessage[];
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

export interface UserContextEmbeddingRow {
  id: string;
  user_id: string;
  content_type: ContentType;
  content: string;
  metadata: Record<string, unknown>;
  embedding: number[];
  created_at: string;
}

// Coach configuration
export interface CoachConfig {
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  temperature: number;
  maxTokens: number;
  streamEnabled: boolean;
  contextWindow: number;
  systemPrompt: string;
}

// Coaching style types
export interface CoachingStyle {
  tone: 'motivational' | 'analytical' | 'supportive' | 'strict';
  verbosity: 'concise' | 'detailed' | 'balanced';
  technicality: 'beginner' | 'intermediate' | 'advanced';
  personality: CoachPersonality;
}

export interface CoachPersonality {
  name: string;
  avatar?: string;
  catchphrase?: string;
  specialties: string[];
  background: string;
}

// Rate limiting types
export interface RateLimit {
  userId: string;
  endpoint: string;
  requests: number;
  window: number;
  resetAt: Date;
}

// Analytics types
export interface CoachingAnalytics {
  userId: string;
  totalSessions: number;
  averageSessionLength: number;
  topTopics: string[];
  satisfactionScore?: number;
  lastActive: Date;
  insights: CoachingInsight[];
}

export interface CoachingInsight {
  type: 'engagement' | 'progress' | 'consistency' | 'improvement';
  metric: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  recommendation?: string;
}

// Error types
export interface CoachError extends Error {
  code: CoachErrorCode;
  details?: unknown;
  recoverable: boolean;
  userMessage: string;
}

export enum CoachErrorCode {
  RATE_LIMIT = 'RATE_LIMIT',
  CONTEXT_RETRIEVAL = 'CONTEXT_RETRIEVAL',
  EMBEDDING_GENERATION = 'EMBEDDING_GENERATION',
  API_ERROR = 'API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  STREAMING_ERROR = 'STREAMING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR'
}

// Enhanced context types for profile and goals integration
export interface GoalContext {
  id: string;
  type: string;
  description: string;
  target: {
    value: number | null;
    unit: string | null;
    date: string | null;
  };
  priority: number;
  progress: number;
  status: string;
}

export interface CapabilityContext {
  equipment: string[];
  skillLevel: string;
  timeAvailable: string | null;
  trainingEnvironment: 'home' | 'gym' | 'outdoor' | 'mixed';
}

export interface LimitationContext {
  physical: string[];
  time: string | null;
  equipment: string[];
  dietary: string[];
}

// Validation schemas
export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}