'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { ArrowLeft, Edit, Trash2, AlertCircle, Loader2, Calendar, Target } from 'lucide-react'
import { getEvent, getPrimaryEventCountdown, deleteEvent } from '@/lib/api/events'
import { EventCountdownWidget } from '@/components/Events/EventCountdownWidget'
import { TrainingPhaseTimeline } from '@/components/Events/TrainingPhaseTimeline'
import BottomNavigation from '@/app/components/BottomNavigation'
import type { Event, EventCountdown } from '@/types/event'
import { formatEventDate, getEventTypeMetadata } from '@/types/event'

export default function EventDetailPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [countdown, setCountdown] = useState<EventCountdown | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    loadEvent()
  }, [eventId])

  async function loadEvent() {
    try {
      setIsLoading(true)
      setError(null)

      const eventData = await getEvent(eventId)
      setEvent(eventData)

      // If this is the primary event, get countdown data
      if (eventData.is_primary_goal) {
        try {
          const countdownData = await getPrimaryEventCountdown()
          if (countdownData.id === eventId) {
            setCountdown(countdownData)
          }
        } catch (err) {
          // Not critical if countdown fails
          console.warn('Failed to load countdown:', err)
        }
      }
    } catch (err) {
      console.error('Failed to load event:', err)
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    try {
      setIsDeleting(true)
      await deleteEvent(eventId)
      router.push('/events')
    } catch (err) {
      console.error('Failed to delete event:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete event')
      setShowDeleteDialog(false)
      setIsDeleting(false)
    }
  }

  const eventMeta = event ? getEventTypeMetadata(event.event_type) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-24">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            className="text-iron-gray hover:text-white hover:bg-iron-gray/20 mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>

          {/* Loading skeleton for header */}
          {isLoading && (
            <Skeleton className="h-8 w-64 bg-iron-gray/20 mb-2" />
          )}

          {/* Event name header */}
          {event && (
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{eventMeta?.icon || '🎯'}</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">{event.event_name}</h1>
                  <p className="text-iron-gray text-sm">{eventMeta?.label || event.event_type}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-iron-gray/30 text-white hover:bg-iron-gray/20"
                  onClick={() => router.push(`/events/${eventId}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-64 bg-iron-gray/20" />
            <Skeleton className="h-48 bg-iron-gray/20" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Event Content */}
        {event && !isLoading && (
          <div className="space-y-6">
            {/* Countdown Widget (if primary event) */}
            {countdown && (
              <EventCountdownWidget event={countdown} size="large" showActions={true} />
            )}

            {/* Event Details Card (if not primary - no countdown) */}
            {!countdown && (
              <div className="bg-iron-black/50 rounded-lg p-6 border border-iron-gray/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-iron-orange" />
                      <h3 className="text-white font-semibold">Event Date</h3>
                    </div>
                    <p className="text-lg text-white">{formatEventDate(event.event_date)}</p>
                  </div>

                  {event.goal_performance && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-iron-orange" />
                        <h3 className="text-white font-semibold">Goal</h3>
                      </div>
                      <p className="text-lg text-white">{event.goal_performance}</p>
                    </div>
                  )}
                </div>

                {event.notes && (
                  <div className="mt-6 pt-6 border-t border-iron-gray/20">
                    <h3 className="text-white font-semibold mb-2">Notes</h3>
                    <p className="text-iron-gray">{event.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Training Phase Timeline (if primary event) */}
            {countdown && <TrainingPhaseTimeline event={countdown} />}

            {/* Linked Program */}
            {event.linked_program_id && (
              <div className="bg-iron-black/50 rounded-lg p-6 border border-iron-gray/20">
                <h3 className="text-white font-semibold mb-4">Linked Training Program</h3>
                <p className="text-iron-gray mb-4">
                  This event has a personalized training program designed to peak at your event date.
                </p>
                <Button
                  onClick={() => router.push(`/programs/${event.linked_program_id}`)}
                  className="bg-iron-orange hover:bg-iron-orange/90 text-white"
                >
                  View Program
                </Button>
              </div>
            )}

            {/* Create Program CTA */}
            {!event.linked_program_id && (
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
                <h3 className="text-blue-400 font-semibold mb-2">🎯 Generate Event-Specific Program</h3>
                <p className="text-blue-300/80 mb-4">
                  Create a personalized training program that automatically periodizes to peak at your event date with calculated base, build, peak, and taper phases.
                </p>
                <Button
                  onClick={() => router.push(`/programs/create?event_id=${event.id}`)}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Create Training Program
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-iron-black border-iron-gray/30">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Event</DialogTitle>
            <DialogDescription className="text-iron-gray">
              Are you sure you want to delete "{event?.event_name}"? This action cannot be undone.
              {event?.linked_program_id && (
                <p className="mt-2 text-yellow-400">
                  Note: The linked training program will not be deleted.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-iron-gray/30 text-white hover:bg-iron-gray/20"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  )
}
