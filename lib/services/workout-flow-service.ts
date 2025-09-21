// Service Implementation Interface for Workout User Flows
// Following TDD Step 3: Interface Definitions

import { createClient } from '@/lib/supabase/client';
import type {
  WorkoutService,
  Workout,
  WorkoutExercise,
  ActiveWorkoutSession,
  SetPerformance,
  WorkoutCompletion,
  WorkoutStats,
  SessionStatus,
  ApiResponse
} from '@/lib/types/workout-flows';

export class WorkoutFlowService implements WorkoutService {
  private supabase = createClient();

  // ============================================================================
  // DASHBOARD FLOW METHODS
  // ============================================================================

  async getWorkoutsWithExercises(userId: string): Promise<Workout[]> {
    // Implementation will call get_dashboard_workouts RPC
    throw new Error('Method not implemented');
  }

  async getWorkoutDetails(workoutId: number): Promise<{
    workout: Workout;
    exercises: WorkoutExercise[];
  }> {
    // Implementation will call get_workout_details RPC
    throw new Error('Method not implemented');
  }

  async toggleFavoriteWorkout(userId: string, workoutId: number): Promise<boolean> {
    // Implementation will call toggle_favorite_workout RPC
    throw new Error('Method not implemented');
  }

  // ============================================================================
  // ACTIVE SESSION FLOW METHODS
  // ============================================================================

  async startWorkoutSession(userId: string, workoutId: number): Promise<number> {
    // Implementation will call start_workout_session RPC
    throw new Error('Method not implemented');
  }

  async getActiveSession(sessionId: number): Promise<ActiveWorkoutSession> {
    // Implementation will fetch session with exercises
    throw new Error('Method not implemented');
  }

  async getSessionExercises(sessionId: number): Promise<WorkoutExercise[]> {
    // Implementation will call get_session_exercises RPC
    throw new Error('Method not implemented');
  }

  async logSetPerformance(
    performance: Omit<SetPerformance, 'id' | 'completed_at'>
  ): Promise<number> {
    // Implementation will call log_set_performance RPC
    throw new Error('Method not implemented');
  }

  async pauseWorkoutSession(sessionId: number): Promise<SessionStatus> {
    // Implementation will call toggle_workout_pause RPC
    throw new Error('Method not implemented');
  }

  async resumeWorkoutSession(sessionId: number): Promise<SessionStatus> {
    // Implementation will call toggle_workout_pause RPC
    throw new Error('Method not implemented');
  }

  async completeWorkoutSession(
    sessionId: number,
    rating?: number,
    notes?: string
  ): Promise<boolean> {
    // Implementation will call complete_workout_session RPC
    throw new Error('Method not implemented');
  }

  async cancelWorkoutSession(sessionId: number): Promise<boolean> {
    // Implementation will update session status to cancelled
    throw new Error('Method not implemented');
  }

  // ============================================================================
  // PROGRESS MANAGEMENT FLOW METHODS
  // ============================================================================

  async getUserWorkoutHistory(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<WorkoutCompletion[]> {
    // Implementation will call get_user_workout_history RPC
    throw new Error('Method not implemented');
  }

  async editWorkoutCompletion(
    completionId: number,
    updates: Partial<WorkoutCompletion>
  ): Promise<boolean> {
    // Implementation will call edit_workout_completion RPC
    throw new Error('Method not implemented');
  }

  async deleteWorkoutCompletion(userId: string, completionId: number): Promise<boolean> {
    // Implementation will call delete_workout_history RPC
    throw new Error('Method not implemented');
  }

  async getUserStats(userId: string): Promise<WorkoutStats> {
    // Implementation will calculate stats from workout history
    throw new Error('Method not implemented');
  }
}

// ============================================================================
// UTILITY FUNCTIONS INTERFACE
// ============================================================================

export interface WorkoutFlowUtils {
  // Time utilities
  formatTime(seconds: number): string;
  calculateDuration(startTime: Date, endTime: Date, pauseDuration: number): number;
  isValidDuration(duration: number): boolean;

  // Weight utilities
  formatWeight(weight: number, unit: 'lbs' | 'kg'): string;
  convertWeight(weight: number, from: 'lbs' | 'kg', to: 'lbs' | 'kg'): number;
  isValidWeight(weight: number): boolean;

  // Exercise utilities
  getExerciseState(exerciseIndex: number, currentIndex: number): 'upcoming' | 'current' | 'completed';
  shouldShowWeightInput(equipment: string): boolean;
  getRestDuration(exercise: WorkoutExercise): number;

  // Validation utilities
  validateSetPerformance(performance: Partial<SetPerformance>): string[];
  validateWorkoutCompletion(completion: Partial<WorkoutCompletion>): string[];
  validateSessionState(session: ActiveWorkoutSession): string[];

  // State utilities
  calculateCompletionPercentage(completedSets: number, totalSets: number): number;
  getTotalSetsForWorkout(exercises: WorkoutExercise[]): number;
  getCompletedSetsCount(completedSets: Record<string, SetPerformance[]>): number;
}

// ============================================================================
// ERROR HANDLER INTERFACE
// ============================================================================

export interface WorkoutErrorHandler {
  handleDatabaseError(error: unknown): ApiResponse<null>;
  handleValidationError(field: string, value: unknown, message: string): ApiResponse<null>;
  handleSessionError(sessionId: number, error: unknown): ApiResponse<null>;
  handleNetworkError(error: unknown): ApiResponse<null>;

  // User-friendly error messages
  getErrorMessage(errorCode: string): string;
  shouldRetry(error: unknown): boolean;
  logError(error: unknown, context: Record<string, unknown>): void;
}

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export interface WorkoutStorage {
  // Session persistence
  saveSessionState(sessionId: number, state: Partial<ActiveWorkoutSession>): void;
  getSessionState(sessionId: number): Partial<ActiveWorkoutSession> | null;
  clearSessionState(sessionId: number): void;

  // Timer persistence
  saveTimerState(sessionId: number, elapsedTime: number, pauseDuration: number): void;
  getTimerState(sessionId: number): { elapsedTime: number; pauseDuration: number } | null;
  clearTimerState(sessionId: number): void;

  // User preferences
  saveUserPreferences(userId: string, preferences: Record<string, unknown>): void;
  getUserPreferences(userId: string): Record<string, unknown> | null;

  // Cache management
  invalidateCache(key: string): void;
  clearAllCache(): void;
}

// ============================================================================
// ANALYTICS INTERFACE
// ============================================================================

export interface WorkoutAnalytics {
  // User flow tracking
  trackWorkoutStarted(workoutId: number, userId: string): void;
  trackSetCompleted(exerciseId: number, setNumber: number, userId: string): void;
  trackExerciseSkipped(exerciseId: number, reason: string, userId: string): void;
  trackWorkoutCompleted(workoutId: number, duration: number, userId: string): void;
  trackWorkoutCancelled(workoutId: number, reason: string, userId: string): void;

  // Feature usage tracking
  trackWeightInputUsed(exerciseId: number, equipment: string, userId: string): void;
  trackDirectNavigation(fromExercise: number, toExercise: number, userId: string): void;
  trackPauseUsage(duration: number, userId: string): void;
  trackEditWorkoutUsage(completionId: number, fieldsEdited: string[], userId: string): void;

  // Performance tracking
  trackPageLoadTime(page: string, loadTime: number): void;
  trackActionResponseTime(action: string, responseTime: number): void;
  trackErrorOccurrence(errorType: string, errorMessage: string, context: Record<string, unknown>): void;

  // Business metrics
  trackUserRetention(userId: string, daysSinceLastWorkout: number): void;
  trackFeatureAdoption(feature: string, userId: string): void;
  trackConversionFunnel(step: string, userId: string): void;
}

// ============================================================================
// NOTIFICATION INTERFACE
// ============================================================================

export interface WorkoutNotifications {
  // Rest timer notifications
  showRestCompleteNotification(nextExercise: string): void;
  showSetReminderNotification(exercise: string, setNumber: number): void;

  // Progress notifications
  showWorkoutCompletedNotification(workoutName: string, duration: string): void;
  showPersonalRecordNotification(exercise: string, achievement: string): void;
  showStreakNotification(streakCount: number): void;

  // Error notifications
  showErrorNotification(message: string, action?: string): void;
  showSuccessNotification(message: string): void;
  showWarningNotification(message: string): void;

  // Permission requests
  requestNotificationPermission(): Promise<boolean>;
  checkNotificationPermission(): boolean;
}

// ============================================================================
// CONFIGURATION INTERFACE
// ============================================================================

export interface WorkoutConfig {
  // Default values
  DEFAULT_REST_DURATION: number;
  DEFAULT_SET_COUNT: number;
  DEFAULT_REP_RANGE: string;

  // Timing constants
  TIMER_UPDATE_INTERVAL: number;
  AUTO_ADVANCE_DELAY: number;
  SESSION_TIMEOUT: number;

  // UI constants
  EXERCISE_PREVIEW_COUNT: number;
  WEIGHT_INPUT_PRECISION: number;
  PAGINATION_LIMIT: number;

  // Validation limits
  MAX_WEIGHT: number;
  MAX_REPS: number;
  MAX_SETS: number;
  MAX_WORKOUT_DURATION: number;

  // Feature flags
  ENABLE_OFFLINE_MODE: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_NOTIFICATIONS: boolean;
  ENABLE_WEIGHT_CONVERSION: boolean;
}

// ============================================================================
// EXPORT SINGLETON INSTANCES
// ============================================================================

export const workoutFlowService = new WorkoutFlowService();

// These will be implemented in separate files
export const workoutFlowUtils: WorkoutFlowUtils = {} as WorkoutFlowUtils;
export const workoutErrorHandler: WorkoutErrorHandler = {} as WorkoutErrorHandler;
export const workoutStorage: WorkoutStorage = {} as WorkoutStorage;
export const workoutAnalytics: WorkoutAnalytics = {} as WorkoutAnalytics;
export const workoutNotifications: WorkoutNotifications = {} as WorkoutNotifications;
export const workoutConfig: WorkoutConfig = {} as WorkoutConfig;