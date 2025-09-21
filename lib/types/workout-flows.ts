// Type definitions for Workout User Flows
// Following TDD Step 3: Interface Definitions

// ============================================================================
// CORE DOMAIN TYPES
// ============================================================================

export interface Workout {
  id: number;
  name: string;
  type: WorkoutType;
  goal: WorkoutGoal;
  difficulty: WorkoutDifficulty;
  estimated_duration_minutes: number;
  description: string;
  is_favorite: boolean;
  exercise_count?: number;
}

export interface Exercise {
  id: number;
  name: string;
  category: ExerciseCategory;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  difficulty: WorkoutDifficulty;
  instructions?: string[];
}

export interface WorkoutExercise {
  exercise_id: number;
  exercise_name: string;
  exercise_category: ExerciseCategory;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  sets_planned: number;
  reps_planned: string;
  rest_seconds: number;
  order_index: number;
  notes?: string;
  sets_completed: number;
  last_weight_used?: number;
}

// ============================================================================
// SESSION MANAGEMENT TYPES
// ============================================================================

export interface ActiveWorkoutSession {
  id: number;
  user_id: string;
  workout_id: number;
  workout_name: string;
  status: SessionStatus;
  started_at: Date;
  current_exercise_index: number;
  current_set: number;
  elapsed_time_seconds: number;
  total_pause_duration_seconds: number;
  exercises: WorkoutExercise[];
}

export interface SetPerformance {
  id?: number;
  session_id: number;
  exercise_id: number;
  set_number: number;
  reps_performed?: number;
  weight_used?: number;
  notes?: string;
  completed_at: Date;
}

export interface WorkoutCompletion {
  id: number;
  user_id: string;
  workout_id: number;
  workout_name: string;
  workout_type: WorkoutType;
  completed_at: Date;
  duration_seconds: number;
  rating?: number;
  notes?: string;
  sets_performed: number;
  total_weight_lifted?: number;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface WorkoutModalState {
  isOpen: boolean;
  selectedWorkout: Workout | null;
  exercises: WorkoutExercise[];
  loading: boolean;
}

export interface ActiveWorkoutState {
  session: ActiveWorkoutSession;
  currentExercise: WorkoutExercise;
  currentSet: number;
  restTimer: number | null;
  isPaused: boolean;
  completedSets: Record<string, SetPerformance[]>;
  weightInput: string;
  repsInput: string;
  showWeightInput: boolean;
}

export interface ProgressState {
  workoutHistory: WorkoutCompletion[];
  editingWorkout: number | null;
  stats: WorkoutStats;
  loading: boolean;
}

export interface WorkoutStats {
  totalCompleted: number;
  currentStreak: number;
  totalDuration: number;
  averageDuration: number;
  totalWeightLifted: number;
  favoriteWorkoutType: WorkoutType;
}

// ============================================================================
// NAVIGATION AND FLOW TYPES
// ============================================================================

export interface ExerciseNavigationOption {
  type: 'normal' | 'skip_sets' | 'direct_jump';
  target_exercise_index?: number;
  target_set?: number;
}

export interface WorkoutCompletionOption {
  type: 'finish' | 'cancel' | 'pause';
  save_progress: boolean;
  redirect_path: string;
}

export interface WeightTrackingConfig {
  equipment: Equipment;
  show_by_default: boolean;
  previous_weight?: number;
  is_optional: boolean;
}

// ============================================================================
// ENUMS AND CONSTANTS
// ============================================================================

export type WorkoutType =
  | 'push'
  | 'pull'
  | 'legs'
  | 'upper'
  | 'lower'
  | 'full_body'
  | 'core'
  | 'arms'
  | 'shoulders'
  | 'chest'
  | 'back'
  | 'cardio';

export type WorkoutGoal =
  | 'build_muscle'
  | 'gain_strength'
  | 'lose_weight'
  | 'improve_endurance'
  | 'all';

export type WorkoutDifficulty =
  | 'beginner'
  | 'intermediate'
  | 'advanced';

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'abs'
  | 'lats';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'bands'
  | 'kettlebell';

export type SessionStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type ExerciseState =
  | 'upcoming'
  | 'current'
  | 'completed';

// ============================================================================
// SERVICE INTERFACE DEFINITIONS
// ============================================================================

export interface WorkoutService {
  // Dashboard Flow
  getWorkoutsWithExercises(userId: string): Promise<Workout[]>;
  getWorkoutDetails(workoutId: number): Promise<{
    workout: Workout;
    exercises: WorkoutExercise[];
  }>;
  toggleFavoriteWorkout(userId: string, workoutId: number): Promise<boolean>;

  // Active Session Flow
  startWorkoutSession(userId: string, workoutId: number): Promise<number>;
  getActiveSession(sessionId: number): Promise<ActiveWorkoutSession>;
  getSessionExercises(sessionId: number): Promise<WorkoutExercise[]>;
  logSetPerformance(performance: Omit<SetPerformance, 'id' | 'completed_at'>): Promise<number>;
  pauseWorkoutSession(sessionId: number): Promise<SessionStatus>;
  resumeWorkoutSession(sessionId: number): Promise<SessionStatus>;
  completeWorkoutSession(sessionId: number, rating?: number, notes?: string): Promise<boolean>;
  cancelWorkoutSession(sessionId: number): Promise<boolean>;

  // Progress Management Flow
  getUserWorkoutHistory(userId: string, limit?: number, offset?: number): Promise<WorkoutCompletion[]>;
  editWorkoutCompletion(completionId: number, updates: Partial<WorkoutCompletion>): Promise<boolean>;
  deleteWorkoutCompletion(userId: string, completionId: number): Promise<boolean>;
  getUserStats(userId: string): Promise<WorkoutStats>;
}

// ============================================================================
// COMPONENT PROP INTERFACES
// ============================================================================

export interface DashboardClientProps {
  initialWorkouts: Workout[];
  userId: string;
}

export interface WorkoutModalProps {
  workout: Workout | null;
  exercises: WorkoutExercise[];
  isOpen: boolean;
  onClose: () => void;
  onStart: (workoutId: number) => Promise<void>;
  loading?: boolean;
}

export interface ActiveWorkoutClientProps {
  sessionId: number;
  initialSession: ActiveWorkoutSession;
  initialExercises: WorkoutExercise[];
}

export interface ExerciseListProps {
  exercises: WorkoutExercise[];
  currentIndex: number;
  completedSets: Record<string, SetPerformance[]>;
  onExerciseClick: (index: number) => void;
}

export interface ExerciseDetailProps {
  exercise: WorkoutExercise;
  currentSet: number;
  onSetComplete: (performance: Omit<SetPerformance, 'id' | 'completed_at'>) => Promise<void>;
  onSkipExercise: () => void;
  previousWeight?: number;
  loading?: boolean;
}

export interface WorkoutControlsProps {
  onPause: () => Promise<void>;
  onFinish: () => Promise<void>;
  onCancel: () => Promise<void>;
  isPaused: boolean;
  elapsedTime: number;
  loading?: boolean;
}

export interface RestTimerProps {
  timeRemaining: number;
  nextExercise: WorkoutExercise;
  nextSet: number;
  onSkipRest: () => void;
  onSkipToNextExercise: () => void;
}

export interface WorkoutHistoryProps {
  initialHistory: WorkoutCompletion[];
  userId: string;
  stats: WorkoutStats;
}

export interface EditWorkoutModalProps {
  workout: WorkoutCompletion;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<WorkoutCompletion>) => Promise<void>;
  loading?: boolean;
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseWorkoutSessionReturn {
  session: ActiveWorkoutSession | null;
  exercises: WorkoutExercise[];
  currentExercise: WorkoutExercise | null;
  currentSet: number;
  completedSets: Record<string, SetPerformance[]>;
  loading: boolean;
  error: string | null;

  // Actions
  completeSet: (performance: Omit<SetPerformance, 'id' | 'completed_at'>) => Promise<void>;
  skipToExercise: (exerciseIndex: number) => void;
  skipRemainingsets: () => void;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  finishSession: (rating?: number, notes?: string) => Promise<void>;
  cancelSession: () => Promise<void>;
}

export interface UseTimerReturn {
  elapsedTime: number;
  restTimer: number | null;
  isPaused: boolean;
  totalPauseDuration: number;

  // Actions
  startTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  startRestTimer: (seconds: number) => void;
  skipRestTimer: () => void;
}

export interface UseWorkoutHistoryReturn {
  history: WorkoutCompletion[];
  stats: WorkoutStats;
  loading: boolean;
  error: string | null;

  // Actions
  editWorkout: (id: number, updates: Partial<WorkoutCompletion>) => Promise<void>;
  deleteWorkout: (id: number) => Promise<void>;
  refreshHistory: () => Promise<void>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface WorkoutError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export class WorkoutSessionError extends Error {
  constructor(
    message: string,
    public code: string,
    public sessionId?: number
  ) {
    super(message);
    this.name = 'WorkoutSessionError';
  }
}

export class WorkoutValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public value: unknown
  ) {
    super(message);
    this.name = 'WorkoutValidationError';
  }
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T | null;
  error: WorkoutError | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface WorkoutFlowConfig {
  timer: {
    accuracy_threshold_ms: number;
    auto_pause_on_blur: boolean;
    persist_across_refresh: boolean;
  };

  ui: {
    auto_advance_delay_ms: number;
    rest_timer_auto_start: boolean;
    exercise_preview_count: number;
    sticky_header_enabled: boolean;
  };

  data: {
    auto_save_interval_ms: number;
    optimistic_updates: boolean;
    offline_support: boolean;
  };

  weight_tracking: {
    default_unit: 'lbs' | 'kg';
    decimal_precision: number;
    show_conversion: boolean;
  };
}