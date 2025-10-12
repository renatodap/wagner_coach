/**
 * Meal Logging Module
 *
 * Comprehensive meal logging system with multiple input flows:
 * - Coach detection (AI-powered text analysis in chat)
 * - Photo scan (AI vision for food recognition)
 * - Manual entry (search and build meals)
 *
 * Includes shared editor components, display components, and AI feedback.
 */

// Re-export all flows
export * from './flows/coach-detection'
export * from './flows/photo-scan'
export * from './flows/manual-entry'

// Re-export shared components
export * from './editor'
export * from './display'
export * from './ai-feedback'
