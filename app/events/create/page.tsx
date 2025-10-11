'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EventForm } from '@/components/Events/EventForm'
import BottomNavigation from '@/app/components/BottomNavigation'

export default function CreateEventPage() {
  const router = useRouter()

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
            <h1 className="text-2xl font-bold text-white mb-1">Create New Event</h1>
            <p className="text-iron-gray text-sm">
              Set up your race, competition, or fitness goal
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-iron-black/50 rounded-lg p-6 border border-iron-gray/20">
          <EventForm
            mode="create"
            onSuccess={() => router.push('/events')}
            onCancel={() => router.back()}
          />
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-blue-400 font-semibold mb-2">💡 Smart Training Periodization</h3>
          <p className="text-sm text-blue-300/80 mb-3">
            Wagner Coach will automatically calculate your training phases based on your event date:
          </p>
          <ul className="text-sm text-blue-300/80 space-y-1 list-disc list-inside">
            <li><strong>Base Phase:</strong> Build aerobic foundation</li>
            <li><strong>Build Phase:</strong> Increase intensity and volume</li>
            <li><strong>Peak Phase:</strong> Highest training load</li>
            <li><strong>Taper:</strong> Reduce volume, stay fresh for event day</li>
          </ul>
          <p className="text-sm text-blue-300/80 mt-3">
            Your daily recommendations and AI programs will automatically adapt to your current training phase!
          </p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
