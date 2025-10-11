/**
 * Today's Plan Card
 *
 * Shows timeline view of today's planned activities.
 * Priority 2 for Balanced/Detailed personas.
 *
 * Variants:
 * - Preview (Balanced): Shows 3 items
 * - Detailed (Detailed): Shows all items with checkmarks
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Check, Circle, Dumbbell, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

interface PlanItem {
  id: string
  type: 'meal' | 'workout' | 'rest'
  time: string
  title: string
  description?: string
  completed: boolean
}

interface TodaysPlanCardProps {
  variant: 'balanced' | 'detailed'
  items?: PlanItem[]
}

// Default plan items
const DEFAULT_ITEMS: PlanItem[] = [
  {
    id: '1',
    type: 'meal',
    time: '08:00',
    title: 'Breakfast',
    description: '450 cal • 35g protein',
    completed: false
  },
  {
    id: '2',
    type: 'workout',
    time: '10:30',
    title: 'Upper Body Strength',
    description: '45 min • 6 exercises',
    completed: false
  },
  {
    id: '3',
    type: 'meal',
    time: '13:00',
    title: 'Lunch',
    description: '600 cal • 45g protein',
    completed: false
  },
  {
    id: '4',
    type: 'meal',
    time: '16:00',
    title: 'Snack',
    description: '200 cal • 15g protein',
    completed: false
  },
  {
    id: '5',
    type: 'meal',
    time: '19:00',
    title: 'Dinner',
    description: '650 cal • 50g protein',
    completed: false
  }
]

export function TodaysPlanCard({ variant, items = DEFAULT_ITEMS }: TodaysPlanCardProps) {
  const displayItems = variant === 'balanced' ? items.slice(0, 3) : items
  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length
  const progressPercent = (completedCount / totalCount) * 100

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'meal':
        return <UtensilsCrossed className="w-4 h-4" aria-hidden="true" />
      case 'workout':
        return <Dumbbell className="w-4 h-4" aria-hidden="true" />
      default:
        return <Circle className="w-4 h-4" aria-hidden="true" />
    }
  }

  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-iron-orange" aria-hidden="true" />
            <CardTitle className="text-white text-lg">Today's Plan</CardTitle>
          </div>
          <Link
            href="/plan"
            className="text-xs text-iron-orange hover:underline"
            aria-label="View full 14-day plan"
          >
            View All
          </Link>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>Progress</span>
            <span>
              {completedCount} / {totalCount} completed
            </span>
          </div>
          <div className="w-full bg-iron-black rounded-full h-2">
            <div
              className="bg-iron-orange h-2 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${completedCount} of ${totalCount} tasks completed`}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Timeline Items */}
        <div className="space-y-3">
          {displayItems.map((item, index) => (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                item.completed
                  ? 'bg-iron-black/50 opacity-60'
                  : 'bg-iron-black hover:bg-iron-gray'
              }`}
            >
              {/* Checkbox */}
              <button
                className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  item.completed
                    ? 'bg-iron-orange border-iron-orange'
                    : 'border-gray-500 hover:border-iron-orange'
                }`}
                aria-label={`Mark ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`}
              >
                {item.completed && <Check className="w-4 h-4 text-white" aria-hidden="true" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-400 font-medium">{item.time}</span>
                  <div className="text-gray-500">{getItemIcon(item.type)}</div>
                </div>
                <h4 className={`text-sm font-semibold ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                  {item.title}
                </h4>
                {item.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* View More (Balanced variant only) */}
        {variant === 'balanced' && items.length > 3 && (
          <Link href="/plan">
            <Button
              variant="outline"
              className="w-full border-iron-gray bg-iron-black hover:bg-iron-gray text-gray-300 text-sm"
              aria-label={`View ${items.length - 3} more items in your plan`}
            >
              View {items.length - 3} More Items
            </Button>
          </Link>
        )}

        {/* Empty State */}
        {items.length === 0 && (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-400 text-sm mb-2">No plan for today yet</p>
            <Link href="/plan">
              <Button
                className="bg-iron-orange hover:bg-orange-600 text-white text-sm"
                aria-label="Create your 14-day plan"
              >
                Create Plan
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
