'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { createEvent, updateEvent } from '@/lib/api/events'
import type { Event, CreateEventRequest, UpdateEventRequest } from '@/types/event'
import { EVENT_TYPE_OPTIONS } from '@/types/event'

interface EventFormProps {
  initialData?: Event
  mode: 'create' | 'edit'
  onSuccess?: () => void
  onCancel?: () => void
}

export function EventForm({ initialData, mode, onSuccess, onCancel }: EventFormProps) {
  const router = useRouter()

  // Form state
  const [eventName, setEventName] = useState(initialData?.event_name || '')
  const [eventType, setEventType] = useState(initialData?.event_type || '')
  const [eventDate, setEventDate] = useState<Date | undefined>(
    initialData?.event_date ? new Date(initialData.event_date) : undefined
  )
  const [goalPerformance, setGoalPerformance] = useState(initialData?.goal_performance || '')
  const [notes, setNotes] = useState(initialData?.notes || '')
  const [isPrimaryGoal, setIsPrimaryGoal] = useState(initialData?.is_primary_goal ?? false)

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Validation
  const isValid = eventName.trim() && eventType && eventDate

  // Get category for selected event type
  const selectedEventMeta = EVENT_TYPE_OPTIONS.find(opt => opt.value === eventType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isValid) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const data: CreateEventRequest = {
        event_name: eventName.trim(),
        event_type: eventType as any,
        event_date: format(eventDate!, 'yyyy-MM-dd'),
        goal_performance: goalPerformance.trim() || undefined,
        notes: notes.trim() || undefined,
        is_primary_goal: isPrimaryGoal
      }

      if (mode === 'create') {
        await createEvent(data)
      } else if (initialData) {
        await updateEvent(initialData.id, data as UpdateEventRequest)
      }

      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/events')
      }
    } catch (err) {
      console.error('Failed to save event:', err)
      setError(err instanceof Error ? err.message : 'Failed to save event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Event Name */}
      <div className="space-y-2">
        <Label htmlFor="event-name" className="text-white">
          Event Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="event-name"
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="e.g., Boston Marathon 2026"
          className="bg-iron-black/50 border-iron-gray/30 text-white"
          required
        />
      </div>

      {/* Event Type */}
      <div className="space-y-2">
        <Label htmlFor="event-type" className="text-white">
          Event Type <span className="text-red-500">*</span>
        </Label>
        <Select value={eventType} onValueChange={setEventType} required>
          <SelectTrigger className="bg-iron-black/50 border-iron-gray/30 text-white">
            <SelectValue placeholder="Select event type" />
          </SelectTrigger>
          <SelectContent>
            {EVENT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedEventMeta && (
          <p className="text-sm text-iron-gray">{selectedEventMeta.description}</p>
        )}
      </div>

      {/* Event Date */}
      <div className="space-y-2">
        <Label htmlFor="event-date" className="text-white">
          Event Date <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="event-date"
              variant="outline"
              className="w-full justify-start text-left font-normal bg-iron-black/50 border-iron-gray/30 text-white hover:bg-iron-gray/20"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {eventDate ? format(eventDate, 'PPP') : <span className="text-iron-gray">Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={eventDate}
              onSelect={setEventDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-sm text-iron-gray">The date of your event (must be in the future)</p>
      </div>

      {/* Goal Performance */}
      <div className="space-y-2">
        <Label htmlFor="goal-performance" className="text-white">
          Goal Performance (Optional)
        </Label>
        <Input
          id="goal-performance"
          type="text"
          value={goalPerformance}
          onChange={(e) => setGoalPerformance(e.target.value)}
          placeholder="e.g., Sub 3:30, 500lb deadlift, Top 3 finish"
          className="bg-iron-black/50 border-iron-gray/30 text-white"
        />
        <p className="text-sm text-iron-gray">What are you aiming to achieve?</p>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-white">
          Notes (Optional)
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any notes about this event..."
          className="bg-iron-black/50 border-iron-gray/30 text-white min-h-[100px]"
          rows={4}
        />
      </div>

      {/* Primary Goal Toggle */}
      <div className="flex items-center justify-between bg-iron-black/50 rounded-lg p-4 border border-iron-gray/20">
        <div className="space-y-1">
          <Label htmlFor="primary-goal" className="text-white font-semibold">
            Set as Primary Goal
          </Label>
          <p className="text-sm text-iron-gray">
            Your training and recommendations will prioritize this event
          </p>
        </div>
        <Switch
          id="primary-goal"
          checked={isPrimaryGoal}
          onCheckedChange={setIsPrimaryGoal}
        />
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-iron-gray/30 text-white hover:bg-iron-gray/20"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="flex-1 bg-iron-orange hover:bg-iron-orange/90 text-white"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'create' ? 'Creating...' : 'Saving...'}
            </>
          ) : (
            mode === 'create' ? 'Create Event' : 'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}
