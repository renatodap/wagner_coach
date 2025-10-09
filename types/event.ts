/**
 * Event Types
 *
 * TypeScript interfaces for the event system matching backend API
 */

export type EventType =
  | 'marathon'
  | 'half_marathon'
  | '10k'
  | '5k'
  | 'ultra_marathon'
  | 'triathlon'
  | 'ironman'
  | 'half_ironman'
  | 'cycling_race'
  | 'powerlifting_meet'
  | 'weightlifting_meet'
  | 'bodybuilding_show'
  | 'physique_competition'
  | 'crossfit_competition'
  | 'strongman_competition'
  | 'obstacle_race'
  | 'spartan_race'
  | 'hiking_expedition'
  | 'climbing_expedition'
  | 'swim_meet'
  | 'track_meet'
  | 'other_endurance'
  | 'other_strength'

export type TrainingPhase =
  | 'pre_training'
  | 'base'
  | 'build'
  | 'peak'
  | 'taper'
  | 'event_day'
  | 'post_event'

/**
 * Base event interface
 */
export interface Event {
  id: string
  user_id: string
  event_name: string
  event_type: EventType
  event_date: string // ISO date string
  goal_performance?: string | null
  notes?: string | null
  is_primary_goal: boolean
  linked_program_id?: string | null
  training_start_date?: string | null
  base_phase_start?: string | null
  build_phase_start?: string | null
  peak_phase_start?: string | null
  taper_start?: string | null
  created_at: string
  updated_at: string
}

/**
 * Event countdown response (from /primary/countdown endpoint)
 */
export interface EventCountdown extends Event {
  days_until_event: number
  current_training_phase: TrainingPhase
  training_phases?: {
    training_start_date: string
    base_phase_start: string
    build_phase_start: string
    peak_phase_start: string
    taper_start: string
    event_day: string
  }
}

/**
 * Create event request
 */
export interface CreateEventRequest {
  event_name: string
  event_type: EventType
  event_date: string // YYYY-MM-DD format
  goal_performance?: string
  notes?: string
  is_primary_goal?: boolean
}

/**
 * Update event request (all fields optional)
 */
export interface UpdateEventRequest {
  event_name?: string
  event_type?: EventType
  event_date?: string
  goal_performance?: string
  notes?: string
  is_primary_goal?: boolean
}

/**
 * Event list response
 */
export type EventsListResponse = Event[]

/**
 * Upcoming events response
 */
export interface UpcomingEventsResponse {
  events: Event[]
  count: number
}

/**
 * Event type metadata for UI
 */
export interface EventTypeMetadata {
  value: EventType
  label: string
  icon: string // emoji
  category: 'endurance' | 'strength' | 'hybrid'
  description: string
}

/**
 * Event type options for dropdowns
 */
export const EVENT_TYPE_OPTIONS: EventTypeMetadata[] = [
  // Endurance Events
  {
    value: 'marathon',
    label: 'Marathon',
    icon: '🏃',
    category: 'endurance',
    description: '26.2 miles (42.2 km)'
  },
  {
    value: 'half_marathon',
    label: 'Half Marathon',
    icon: '🏃',
    category: 'endurance',
    description: '13.1 miles (21.1 km)'
  },
  {
    value: '10k',
    label: '10K Run',
    icon: '🏃',
    category: 'endurance',
    description: '10 kilometers (6.2 miles)'
  },
  {
    value: '5k',
    label: '5K Run',
    icon: '🏃',
    category: 'endurance',
    description: '5 kilometers (3.1 miles)'
  },
  {
    value: 'ultra_marathon',
    label: 'Ultra Marathon',
    icon: '🏔️',
    category: 'endurance',
    description: 'Any distance over 42.2 km'
  },
  {
    value: 'triathlon',
    label: 'Triathlon',
    icon: '🏊',
    category: 'hybrid',
    description: 'Swim, bike, run'
  },
  {
    value: 'ironman',
    label: 'Ironman',
    icon: '💪',
    category: 'hybrid',
    description: '2.4mi swim, 112mi bike, 26.2mi run'
  },
  {
    value: 'half_ironman',
    label: 'Half Ironman',
    icon: '💪',
    category: 'hybrid',
    description: '1.2mi swim, 56mi bike, 13.1mi run'
  },
  {
    value: 'cycling_race',
    label: 'Cycling Race',
    icon: '🚴',
    category: 'endurance',
    description: 'Road or mountain bike race'
  },
  {
    value: 'swim_meet',
    label: 'Swim Meet',
    icon: '🏊',
    category: 'endurance',
    description: 'Competitive swimming event'
  },
  {
    value: 'track_meet',
    label: 'Track Meet',
    icon: '🏃',
    category: 'endurance',
    description: 'Track and field competition'
  },

  // Strength Events
  {
    value: 'powerlifting_meet',
    label: 'Powerlifting Meet',
    icon: '🏋️',
    category: 'strength',
    description: 'Squat, bench press, deadlift'
  },
  {
    value: 'weightlifting_meet',
    label: 'Weightlifting Meet',
    icon: '🏋️',
    category: 'strength',
    description: 'Snatch and clean & jerk'
  },
  {
    value: 'strongman_competition',
    label: 'Strongman Competition',
    icon: '💪',
    category: 'strength',
    description: 'Multiple strength events'
  },

  // Physique Events
  {
    value: 'bodybuilding_show',
    label: 'Bodybuilding Show',
    icon: '🏆',
    category: 'strength',
    description: 'Muscle mass and symmetry'
  },
  {
    value: 'physique_competition',
    label: 'Physique Competition',
    icon: '🏆',
    category: 'strength',
    description: 'Athletic physique competition'
  },

  // Hybrid/Other
  {
    value: 'crossfit_competition',
    label: 'CrossFit Competition',
    icon: '🔥',
    category: 'hybrid',
    description: 'Multiple WODs and events'
  },
  {
    value: 'obstacle_race',
    label: 'Obstacle Race',
    icon: '🧗',
    category: 'hybrid',
    description: 'Running with obstacles'
  },
  {
    value: 'spartan_race',
    label: 'Spartan Race',
    icon: '⚔️',
    category: 'hybrid',
    description: 'Obstacle course race'
  },
  {
    value: 'hiking_expedition',
    label: 'Hiking Expedition',
    icon: '🥾',
    category: 'endurance',
    description: 'Multi-day hike or trek'
  },
  {
    value: 'climbing_expedition',
    label: 'Climbing Expedition',
    icon: '🧗',
    category: 'hybrid',
    description: 'Mountain or rock climbing'
  },
  {
    value: 'other_endurance',
    label: 'Other Endurance Event',
    icon: '🎯',
    category: 'endurance',
    description: 'Custom endurance event'
  },
  {
    value: 'other_strength',
    label: 'Other Strength Event',
    icon: '🎯',
    category: 'strength',
    description: 'Custom strength event'
  }
]

/**
 * Get event type metadata by value
 */
export function getEventTypeMetadata(eventType: EventType): EventTypeMetadata | undefined {
  return EVENT_TYPE_OPTIONS.find(option => option.value === eventType)
}

/**
 * Training phase metadata for UI
 */
export interface TrainingPhaseMetadata {
  value: TrainingPhase
  label: string
  color: string // Tailwind color class
  description: string
}

export const TRAINING_PHASE_METADATA: Record<TrainingPhase, TrainingPhaseMetadata> = {
  pre_training: {
    value: 'pre_training',
    label: 'Pre-Training',
    color: 'text-gray-500',
    description: 'Preparing to start structured training'
  },
  base: {
    value: 'base',
    label: 'Base Phase',
    color: 'text-blue-500',
    description: 'Building aerobic foundation'
  },
  build: {
    value: 'build',
    label: 'Build Phase',
    color: 'text-green-500',
    description: 'Increasing volume and intensity'
  },
  peak: {
    value: 'peak',
    label: 'Peak Phase',
    color: 'text-yellow-500',
    description: 'Highest training load'
  },
  taper: {
    value: 'taper',
    label: 'Taper',
    color: 'text-orange-500',
    description: 'Reducing volume, maintaining intensity'
  },
  event_day: {
    value: 'event_day',
    label: 'Event Day',
    color: 'text-red-500',
    description: 'Competition day!'
  },
  post_event: {
    value: 'post_event',
    label: 'Recovery',
    color: 'text-purple-500',
    description: 'Post-event recovery'
  }
}

/**
 * Get training phase metadata
 */
export function getTrainingPhaseMetadata(phase: TrainingPhase): TrainingPhaseMetadata {
  return TRAINING_PHASE_METADATA[phase]
}

/**
 * Format event date for display
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Format countdown display
 */
export function formatCountdown(daysUntil: number): string {
  if (daysUntil === 0) return 'Today!'
  if (daysUntil === 1) return 'Tomorrow!'
  if (daysUntil < 0) return `${Math.abs(daysUntil)} days ago`
  if (daysUntil < 7) return `${daysUntil} days away`
  if (daysUntil < 14) return `${Math.floor(daysUntil / 7)} week away`
  if (daysUntil < 30) return `${Math.floor(daysUntil / 7)} weeks away`
  if (daysUntil < 60) return `About ${Math.floor(daysUntil / 30)} month away`
  return `${Math.floor(daysUntil / 30)} months away`
}
