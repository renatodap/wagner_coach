/**
 * Timezone Utilities
 *
 * Handles timezone conversions between UTC (server) and user's local timezone.
 *
 * STRATEGY:
 * - Server stores ALL timestamps in UTC (ISO 8601 format)
 * - Frontend displays times in user's local timezone
 * - Frontend sends times to server in UTC
 */

import { format, parseISO, formatISO } from 'date-fns'
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'

/**
 * Get user's current timezone (IANA identifier)
 *
 * @returns {string} IANA timezone identifier (e.g., "America/New_York")
 *
 * @example
 * getUserTimezone() // "America/Los_Angeles"
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

/**
 * Convert UTC timestamp to user's local timezone
 *
 * @param {string} utcTimestamp - ISO 8601 UTC timestamp from server
 * @param {string} timezone - Optional IANA timezone (defaults to user's browser timezone)
 * @returns {Date} Date object in user's timezone
 *
 * @example
 * utcToLocal("2025-10-08T14:30:00Z") // Date object in user's local time
 */
export function utcToLocal(utcTimestamp: string, timezone?: string): Date {
  const tz = timezone || getUserTimezone()
  return toZonedTime(parseISO(utcTimestamp), tz)
}

/**
 * Convert user's local time to UTC for server
 *
 * @param {Date} localDate - Date in user's local timezone
 * @param {string} timezone - Optional IANA timezone (defaults to user's browser timezone)
 * @returns {string} ISO 8601 UTC timestamp for server
 *
 * @example
 * localToUtc(new Date()) // "2025-10-08T21:30:00.000Z"
 */
export function localToUtc(localDate: Date, timezone?: string): string {
  const tz = timezone || getUserTimezone()
  return formatISO(fromZonedTime(localDate, tz))
}

/**
 * Format UTC timestamp for display in user's timezone
 *
 * @param {string} utcTimestamp - ISO 8601 UTC timestamp from server
 * @param {string} formatString - date-fns format string (default: "MMM d, yyyy 'at' h:mm a")
 * @param {string} timezone - Optional IANA timezone (defaults to user's browser timezone)
 * @returns {string} Formatted date string in user's timezone
 *
 * @example
 * formatInUserTimezone("2025-10-08T14:30:00Z") // "Oct 8, 2025 at 10:30 AM" (PST)
 * formatInUserTimezone("2025-10-08T14:30:00Z", "yyyy-MM-dd HH:mm") // "2025-10-08 10:30"
 */
export function formatInUserTimezone(
  utcTimestamp: string,
  formatString: string = "MMM d, yyyy 'at' h:mm a",
  timezone?: string
): string {
  const tz = timezone || getUserTimezone()
  return formatInTimeZone(parseISO(utcTimestamp), tz, formatString)
}

/**
 * Format relative time ("2 hours ago", "just now")
 *
 * @param {string} utcTimestamp - ISO 8601 UTC timestamp from server
 * @returns {string} Relative time string
 *
 * @example
 * formatRelativeTime("2025-10-08T14:30:00Z") // "2 hours ago"
 */
export function formatRelativeTime(utcTimestamp: string): string {
  const date = parseISO(utcTimestamp)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`

  // For older dates, show formatted date
  return formatInUserTimezone(utcTimestamp, 'MMM d, yyyy')
}

/**
 * Get current UTC timestamp for sending to server
 *
 * @returns {string} Current UTC timestamp in ISO 8601 format
 *
 * @example
 * getCurrentUtcTimestamp() // "2025-10-08T21:30:00.000Z"
 */
export function getCurrentUtcTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Check if timestamp is today in user's timezone
 *
 * @param {string} utcTimestamp - ISO 8601 UTC timestamp
 * @returns {boolean} True if date is today in user's timezone
 *
 * @example
 * isToday("2025-10-08T14:30:00Z") // true/false
 */
export function isToday(utcTimestamp: string): boolean {
  const userDate = utcToLocal(utcTimestamp)
  const today = new Date()

  return (
    userDate.getDate() === today.getDate() &&
    userDate.getMonth() === today.getMonth() &&
    userDate.getFullYear() === today.getFullYear()
  )
}

/**
 * Save user's timezone preference to profile
 *
 * @param {string} timezone - IANA timezone identifier
 * @returns {Promise<void>}
 */
export async function saveUserTimezone(timezone: string): Promise<void> {
  try {
    const { updateUserTimezone } = await import('@/lib/api/profile')
    await updateUserTimezone(timezone)
  } catch (error) {
    console.error('[saveUserTimezone] Failed:', error)
    // Non-critical - timezone will still work via browser detection
  }
}

/**
 * Auto-detect and save user's timezone on first login
 */
export async function autoDetectAndSaveTimezone(): Promise<void> {
  const timezone = getUserTimezone()
  console.log(`[Timezone] Auto-detected: ${timezone}`)

  // Save to localStorage for immediate use
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_timezone', timezone)
  }

  // Save to profile (non-blocking)
  saveUserTimezone(timezone).catch((err) => {
    console.warn('[Timezone] Auto-save failed (non-critical):', err)
  })
}
