/**
 * Quick Actions Card
 *
 * Provides fast access to the three most common actions:
 * 1. Scan Meal (photo meal logging)
 * 2. Log Meal (text quick entry)
 * 3. Ask Coach (AI chat)
 *
 * Shown to all personas (simple, balanced, detailed) as it's
 * essential functionality for all users.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, UtensilsCrossed, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QuickActionsCardProps {
  variant?: 'simple' | 'balanced' | 'detailed'
}

export function QuickActionsCard({ variant = 'balanced' }: QuickActionsCardProps) {
  const router = useRouter()

  const handleScanMeal = () => {
    router.push('/meal-scan')
  }

  const handleLogMeal = () => {
    router.push('/nutrition/log')
  }

  const handleAskCoach = () => {
    router.push('/coach-v2')
  }

  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Scan Meal Button - PRIMARY ACTION */}
        <Button
          onClick={handleScanMeal}
          className="w-full h-16 bg-iron-orange hover:bg-orange-600 text-white font-bold text-base transition-all shadow-lg hover:shadow-xl"
          aria-label="Scan meal with photo"
        >
          <Camera className="w-6 h-6 mr-2" aria-hidden="true" />
          <div className="flex flex-col items-start">
            <span className="text-base">Scan Meal</span>
            <span className="text-xs font-normal opacity-90">Take a photo to log</span>
          </div>
        </Button>

        {/* Log Meal Button */}
        <Button
          onClick={handleLogMeal}
          variant="outline"
          className="w-full h-12 border-iron-gray bg-iron-black hover:bg-iron-gray text-white font-semibold text-sm transition-all"
          aria-label="Log a meal with text entry"
        >
          <UtensilsCrossed className="w-4 h-4 mr-2" aria-hidden="true" />
          Text Entry
        </Button>

        {/* Ask Coach Button */}
        <Button
          onClick={handleAskCoach}
          variant="outline"
          className="w-full h-12 border-iron-gray bg-iron-black hover:bg-iron-gray text-white font-semibold text-sm transition-all"
          aria-label="Chat with your AI coach"
        >
          <MessageSquare className="w-4 h-4 mr-2" aria-hidden="true" />
          Ask Coach
        </Button>
      </CardContent>
    </Card>
  )
}
