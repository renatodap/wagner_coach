/**
 * Quick Actions Card
 *
 * Provides fast access to the two most common actions:
 * 1. Log a Meal (quick entry)
 * 2. Ask Coach (AI chat)
 *
 * Shown to all personas (simple, balanced, detailed) as it's
 * essential functionality for all users.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, UtensilsCrossed } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface QuickActionsCardProps {
  variant?: 'simple' | 'balanced' | 'detailed'
}

export function QuickActionsCard({ variant = 'balanced' }: QuickActionsCardProps) {
  const router = useRouter()

  const handleLogMeal = () => {
    router.push('/quick-entry-optimized')
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
        {/* Log Meal Button */}
        <Button
          onClick={handleLogMeal}
          className="w-full h-14 bg-iron-orange hover:bg-orange-600 text-white font-semibold text-base transition-all"
          aria-label="Log a meal with quick entry"
        >
          <UtensilsCrossed className="w-5 h-5 mr-2" aria-hidden="true" />
          Log Meal
        </Button>

        {/* Ask Coach Button */}
        <Button
          onClick={handleAskCoach}
          variant="outline"
          className="w-full h-14 border-iron-gray bg-iron-black hover:bg-iron-gray text-white font-semibold text-base transition-all"
          aria-label="Chat with your AI coach"
        >
          <MessageSquare className="w-5 h-5 mr-2" aria-hidden="true" />
          Ask Coach
        </Button>
      </CardContent>
    </Card>
  )
}
