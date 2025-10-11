'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Calendar, AlertCircle, Target } from 'lucide-react'
import { getEvents } from '@/lib/api/events'
import { EventCard } from '@/components/Events/EventCard'
import BottomNavigation from '@/components/BottomNavigation'
import type { Event } from '@/types/event'

export default function EventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvents()
  }, [])

  async function loadEvents() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getEvents()

      // Sort events by date (soonest first)
      const sorted = data.sort((a, b) => {
        return new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
      })

      setEvents(sorted)
    } catch (err) {
      console.error('Failed to load events:', err)
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setIsLoading(false)
    }
  }

  // Separate primary and other events
  const primaryEvent = events.find(e => e.is_primary_goal)
  const otherEvents = events.filter(e => !e.is_primary_goal)

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-24">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">My Events</h1>
              <p className="text-iron-gray text-sm">
                Track your races, competitions, and goals
              </p>
            </div>
            <Button
              onClick={() => router.push('/events/create')}
              className="bg-iron-orange hover:bg-iron-orange/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-iron-gray/20" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !error && events.length === 0 && (
          <div className="text-center py-20">
            <Calendar className="w-16 h-16 text-iron-gray mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Events Yet</h3>
            <p className="text-iron-gray mb-6">
              Create your first event to start tracking your training goals
            </p>
            <Button
              onClick={() => router.push('/events/create')}
              className="bg-iron-orange hover:bg-iron-orange/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Event
            </Button>
          </div>
        )}

        {/* Events List */}
        {!isLoading && !error && events.length > 0 && (
          <div className="space-y-6">
            {/* Primary Event Section */}
            {primaryEvent && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-iron-orange" />
                  <h2 className="text-lg font-semibold text-white">Primary Goal</h2>
                </div>
                <EventCard event={primaryEvent} showPrimaryBadge={false} />
              </div>
            )}

            {/* Other Events Section */}
            {otherEvents.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5 text-iron-orange" />
                  <h2 className="text-lg font-semibold text-white">
                    {primaryEvent ? 'Other Events' : 'Upcoming Events'}
                  </h2>
                  <span className="text-sm text-iron-gray">({otherEvents.length})</span>
                </div>
                <div className="space-y-3">
                  {otherEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {!isLoading && events.length > 0 && (
          <div className="mt-8 bg-iron-black/50 rounded-lg p-6 border border-iron-gray/20">
            <h3 className="text-white font-semibold mb-4">Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-iron-orange">{events.length}</p>
                <p className="text-sm text-iron-gray">Total Events</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-iron-orange">
                  {events.filter(e => e.linked_program_id).length}
                </p>
                <p className="text-sm text-iron-gray">With Programs</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-iron-orange">
                  {events.filter(e => {
                    const daysUntil = Math.ceil(
                      (new Date(e.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return daysUntil <= 30 && daysUntil >= 0
                  }).length}
                </p>
                <p className="text-sm text-iron-gray">This Month</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-iron-orange">
                  {events.filter(e => {
                    const daysUntil = Math.ceil(
                      (new Date(e.event_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                    )
                    return daysUntil <= 7 && daysUntil >= 0
                  }).length}
                </p>
                <p className="text-sm text-iron-gray">This Week</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
