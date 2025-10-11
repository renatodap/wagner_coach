/**
 * Coach Insight Card
 *
 * AI-generated contextual messages and suggestions.
 * Priority: 5 (high when triggered)
 *
 * Conditional: Shows when:
 * - User is struggling (adherence < 60% last 3 days)
 * - Milestone reached (streak % 7 === 0)
 * - Important adjustment needed
 * - Motivational moment
 *
 * Types: motivation, adjustment, milestone, warning
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, MessageSquare, PartyPopper, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

type InsightType = 'motivation' | 'adjustment' | 'milestone' | 'warning'

interface CoachInsight {
  type: InsightType
  title: string
  message: string
  action?: {
    label: string
    href: string
  }
}

interface CoachInsightCardProps {
  insight?: CoachInsight
}

// Default insights for different scenarios
const DEFAULT_INSIGHTS: Record<InsightType, CoachInsight> = {
  motivation: {
    type: 'motivation',
    title: 'You\'re doing great!',
    message: 'Your consistency this week has been impressive. Keep up the momentum and you\'ll hit your goals in no time.',
    action: {
      label: 'View Progress',
      href: '/analytics'
    }
  },
  adjustment: {
    type: 'adjustment',
    title: 'Consider adjusting your plan',
    message: 'I noticed your protein intake has been lower than target this week. Try adding a protein shake or an extra serving of chicken to your meals.',
    action: {
      label: 'Ask Coach',
      href: '/coach-v2'
    }
  },
  milestone: {
    type: 'milestone',
    title: 'Milestone reached! 🎉',
    message: 'You\'ve logged meals consistently for 7 days straight! This kind of dedication is what transforms goals into results.',
    action: {
      label: 'Share Achievement',
      href: '/profile'
    }
  },
  warning: {
    type: 'warning',
    title: 'Let\'s get back on track',
    message: 'You\'ve missed logging a few meals this week. No worries—everyone has off days. Let\'s refocus and get back to your routine.',
    action: {
      label: 'Talk to Coach',
      href: '/coach-v2'
    }
  }
}

export function CoachInsightCard({ insight = DEFAULT_INSIGHTS.motivation }: CoachInsightCardProps) {
  const getIcon = (type: InsightType) => {
    switch (type) {
      case 'motivation':
        return <TrendingUp className="w-6 h-6 text-green-500" aria-hidden="true" />
      case 'adjustment':
        return <TrendingDown className="w-6 h-6 text-blue-500" aria-hidden="true" />
      case 'milestone':
        return <PartyPopper className="w-6 h-6 text-yellow-500" aria-hidden="true" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-orange-500" aria-hidden="true" />
    }
  }

  const getBackgroundGradient = (type: InsightType): string => {
    switch (type) {
      case 'motivation':
        return 'from-green-600 to-emerald-600'
      case 'adjustment':
        return 'from-blue-600 to-indigo-600'
      case 'milestone':
        return 'from-yellow-600 to-orange-600'
      case 'warning':
        return 'from-orange-600 to-red-600'
    }
  }

  return (
    <Card className={`bg-gradient-to-br ${getBackgroundGradient(insight.type)} border-none shadow-lg`}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-lg flex-shrink-0">
            {getIcon(insight.type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-white/80" aria-hidden="true" />
              <span className="text-xs text-white/80 font-medium uppercase tracking-wide">
                Coach Insight
              </span>
            </div>
            <CardTitle className="text-white text-lg">
              {insight.title}
            </CardTitle>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Message */}
        <p className="text-white/90 text-sm leading-relaxed">
          {insight.message}
        </p>

        {/* Action Button */}
        {insight.action && (
          <Link href={insight.action.href}>
            <Button
              className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-sm border border-white/20 transition-all"
              aria-label={insight.action.label}
            >
              {insight.action.label}
            </Button>
          </Link>
        )}

        {/* Dismiss option for non-warning insights */}
        {insight.type !== 'warning' && (
          <button
            className="text-white/60 hover:text-white/80 text-xs text-center w-full transition-colors"
            aria-label="Dismiss this insight"
          >
            Dismiss
          </button>
        )}
      </CardContent>
    </Card>
  )
}
