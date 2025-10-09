/**
 * Events API Client
 *
 * Functions for interacting with the events API
 */

import { createClient } from '@/lib/supabase/client'
import type {
  Event,
  EventCountdown,
  CreateEventRequest,
  UpdateEventRequest,
  EventsListResponse,
  UpcomingEventsResponse
} from '@/types/event'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Get authentication token from Supabase
 */
async function getAuthToken(): Promise<string> {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Not authenticated')
  }

  return session.access_token
}

/**
 * Create a new event
 */
export async function createEvent(event: CreateEventRequest): Promise<Event> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(event)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Failed to create event')
  }

  return response.json()
}

/**
 * Get all user events
 */
export async function getEvents(): Promise<EventsListResponse> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/events`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch events: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get upcoming events within N days
 */
export async function getUpcomingEvents(daysAhead: number = 90): Promise<Event[]> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/events/upcoming?days_ahead=${daysAhead}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch upcoming events: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get primary event with countdown
 */
export async function getPrimaryEventCountdown(): Promise<EventCountdown> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/events/primary/countdown`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No primary event found')
    }
    throw new Error(`Failed to fetch primary event: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string): Promise<Event> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Event not found')
    }
    throw new Error(`Failed to fetch event: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Update an event
 */
export async function updateEvent(
  eventId: string,
  updates: UpdateEventRequest
): Promise<Event> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || 'Failed to update event')
  }

  return response.json()
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const token = await getAuthToken()

  const response = await fetch(`${API_BASE_URL}/api/v1/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Event not found')
    }
    throw new Error(`Failed to delete event: ${response.statusText}`)
  }
}

/**
 * Set an event as primary goal
 */
export async function setPrimaryEvent(eventId: string): Promise<Event> {
  return updateEvent(eventId, { is_primary_goal: true })
}
