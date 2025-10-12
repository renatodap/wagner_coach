/**
 * Profile Constants
 *
 * Centralized constants for profile-related dropdown options, validation rules,
 * and display values. This ensures consistency across the app and makes it easier
 * to add internationalization (i18n) in the future.
 *
 * NOTE: When adding i18n, these constant values will become translation keys.
 */

// =====================================================
// Dropdown Options
// =====================================================

export const PRIMARY_GOAL_OPTIONS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'build_muscle', label: 'Build Muscle' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'improve_performance', label: 'Improve Performance' },
] as const

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const

export const ACTIVITY_LEVEL_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary - Little to no exercise' },
  { value: 'lightly_active', label: 'Lightly Active - Exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active - Exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active - Exercise 6-7 days/week' },
  { value: 'extremely_active', label: 'Extremely Active - Physical job + exercise' },
] as const

export const DIETARY_PREFERENCE_OPTIONS = [
  { value: 'none', label: 'No dietary restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
] as const

export const STRESS_LEVEL_OPTIONS = [
  { value: 'low', label: 'Low - Minimal daily stress' },
  { value: 'medium', label: 'Medium - Moderate daily stress' },
  { value: 'high', label: 'High - High daily stress' },
] as const

export const BIOLOGICAL_SEX_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const

export const UNIT_SYSTEM_OPTIONS = [
  { value: 'metric', label: 'Metric (kg, cm)' },
  { value: 'imperial', label: 'Imperial (lbs, inches)' },
] as const

// =====================================================
// Common Timezones
// =====================================================

export const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (US)' },
  { value: 'America/Chicago', label: 'Central Time (US)' },
  { value: 'America/Denver', label: 'Mountain Time (US)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US)' },
  { value: 'America/Phoenix', label: 'Arizona Time (US)' },
  { value: 'America/Anchorage', label: 'Alaska Time (US)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (US)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'UTC', label: 'UTC' },
] as const

// =====================================================
// Validation Rules
// =====================================================

export const VALIDATION_RULES = {
  age: { min: 13, max: 120 },
  height_cm: { min: 100, max: 250 },
  weight_kg: { min: 30, max: 300 },
  workout_frequency: { min: 0, max: 7 },
  meals_per_day: { min: 1, max: 10 },
  sleep_hours: { min: 4, max: 12, step: 0.5 },
  food_allergies_max: 20,
  foods_to_avoid_max: 20,
} as const

// =====================================================
// Display Formatters
// =====================================================

/**
 * Format a goal string for display (e.g., "lose_weight" -> "Lose Weight")
 */
export function formatGoal(goal?: string): string {
  if (!goal) return 'Not set'
  return goal
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format an activity level string for display
 */
export function formatActivityLevel(level?: string): string {
  if (!level) return 'Not set'
  return level
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Format a biological sex string for display
 */
export function formatBiologicalSex(sex?: string): string {
  if (!sex) return 'Not set'
  return sex.charAt(0).toUpperCase() + sex.slice(1)
}

/**
 * Format an experience level string for display
 */
export function formatExperienceLevel(level?: string): string {
  if (!level) return 'Not set'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

/**
 * Format a stress level string for display
 */
export function formatStressLevel(level?: string): string {
  if (!level) return 'Not set'
  return level.charAt(0).toUpperCase() + level.slice(1)
}

/**
 * Format dietary preference for display
 */
export function formatDietaryPreference(preference?: string): string {
  if (!preference || preference === 'none') return 'None'
  return formatGoal(preference)
}

/**
 * Format unit system for display
 */
export function formatUnitSystem(system?: string): string {
  if (!system) return 'Not set'
  return system.charAt(0).toUpperCase() + system.slice(1)
}

// =====================================================
// Type Exports
// =====================================================

export type PrimaryGoal = (typeof PRIMARY_GOAL_OPTIONS)[number]['value']
export type ExperienceLevel = (typeof EXPERIENCE_LEVEL_OPTIONS)[number]['value']
export type ActivityLevel = (typeof ACTIVITY_LEVEL_OPTIONS)[number]['value']
export type DietaryPreference = (typeof DIETARY_PREFERENCE_OPTIONS)[number]['value']
export type StressLevel = (typeof STRESS_LEVEL_OPTIONS)[number]['value']
export type BiologicalSex = (typeof BIOLOGICAL_SEX_OPTIONS)[number]['value']
export type UnitSystem = (typeof UNIT_SYSTEM_OPTIONS)[number]['value']
export type Timezone = (typeof TIMEZONE_OPTIONS)[number]['value']
