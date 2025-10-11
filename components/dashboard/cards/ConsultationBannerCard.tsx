/**
 * Consultation Banner Card
 *
 * Priority 0 (highest) - Always shown first when consultation is incomplete.
 *
 * Two variants:
 * 1. Initial consultation (not completed) - Cannot be dismissed
 * 2. Day 13 review consultation - Can be dismissed but encouraged
 *
 * This card is CRITICAL as it blocks access to personalized features
 * until the user completes their initial consultation.
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Calendar, CheckCircle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface ConsultationBannerCardProps {
  variant: 'initial' | 'day13_review'
  programDayNumber?: number
  onDismiss?: () => void
}

export function ConsultationBannerCard({
  variant,
  programDayNumber,
  onDismiss
}: ConsultationBannerCardProps) {
  const router = useRouter()
  const [isDismissed, setIsDismissed] = useState(false)

  const handleStartConsultation = () => {
    router.push('/onboarding/consultation')
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    onDismiss?.()
  }

  // Don't render if dismissed (only for day 13 review)
  if (isDismissed && variant === 'day13_review') {
    return null
  }

  if (variant === 'initial') {
    return (
      <Card className="bg-gradient-to-br from-iron-orange to-orange-600 border-iron-orange shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <AlertCircle className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white text-xl mb-1">
                Complete Your Consultation
              </CardTitle>
              <CardDescription className="text-white/90 text-sm">
                Answer a few questions to unlock your personalized dashboard and AI-powered coaching
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Benefits List */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Get a personalized 14-day program</span>
            </div>
            <div className="flex items-center gap-2 text-white text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Unlock AI coach tailored to your goals</span>
            </div>
            <div className="flex items-center gap-2 text-white text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <span>Track progress with adaptive metrics</span>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={handleStartConsultation}
            className="w-full h-12 bg-white hover:bg-gray-100 text-iron-orange font-bold text-base shadow-md transition-all"
            aria-label="Start consultation to personalize your experience"
          >
            Start Consultation (5 min)
          </Button>

          {/* Urgency Message */}
          <p className="text-xs text-white/80 text-center">
            Takes less than 5 minutes • Required for personalized experience
          </p>
        </CardContent>
      </Card>
    )
  }

  // Day 13 Review variant
  return (
    <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-blue-600 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="bg-white/20 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-white text-lg mb-1">
                Day {programDayNumber} Check-In
              </CardTitle>
              <CardDescription className="text-white/90 text-sm">
                You're almost done! Let's review your progress and adjust your plan if needed.
              </CardDescription>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Dismiss day 13 check-in reminder"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review Points */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Review your 2-week progress</span>
          </div>
          <div className="flex items-center gap-2 text-white text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Adjust goals and preferences</span>
          </div>
          <div className="flex items-center gap-2 text-white text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>Optimize your next 14 days</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleStartConsultation}
            className="flex-1 h-11 bg-white hover:bg-gray-100 text-blue-700 font-semibold transition-all"
            aria-label="Start day 13 review consultation"
          >
            Start Review
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1 h-11 border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold transition-all"
            aria-label="Remind me later"
          >
            Later
          </Button>
        </div>

        {/* Optional message */}
        <p className="text-xs text-white/70 text-center">
          Takes 3-5 minutes • Helps optimize your results
        </p>
      </CardContent>
    </Card>
  )
}
