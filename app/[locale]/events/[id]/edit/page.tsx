'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { getEvent } from '@/lib/api/events'
import { EventForm } from '@/components/Events/EventForm'
import BottomNavigation from '@/components/BottomNavigation'
import type { Event } from '@/types/event'

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadEvent()
  }, [eventId])

  async function loadEvent() {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getEvent(eventId)
      setEvent(data)
    } catch (err) {
      console.error('Failed to load event:', err)
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-24">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            className="text-iron-gray hover:text-white hover:bg-iron-gray/20 mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Edit Event</h1>
            <p className="text-iron-gray text-sm">
              Update your event details
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6 bg-iron-black/50 rounded-lg p-6 border border-iron-gray/20">
            <Skeleton className="h-10 bg-iron-gray/20" />
            <Skeleton className="h-10 bg-iron-gray/20" />
            <Skeleton className="h-10 bg-iron-gray/20" />
            <Skeleton className="h-32 bg-iron-gray/20" />
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Event Form */}
        {event && !isLoading && (
          <div className="bg-iron-black/50 rounded-lg p-6 border border-iron-gray/20">
            <EventForm
              initialData={event}
              mode="edit"
              onSuccess={() => router.push(`/events/${eventId}`)}
              onCancel={() => router.back()}
            />
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
