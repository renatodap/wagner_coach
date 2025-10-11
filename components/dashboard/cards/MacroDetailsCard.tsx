/**
 * Macro Details Card
 *
 * Expanded macro breakdown for users who want details.
 * Priority: 15 (low) - only for Simple persona as collapsible accordion
 *
 * For Balanced/Detailed, macro details are already in NutritionCard.
 * This card provides an OPTIONAL expansion for Simple users who want to see macros.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface MacroData {
  proteinConsumed: number
  proteinTarget: number
  carbsConsumed: number
  carbsTarget: number
  fatsConsumed: number
  fatsTarget: number
}

interface MacroDetailsCardProps {
  data?: MacroData
}

const DEFAULT_DATA: MacroData = {
  proteinConsumed: 0,
  proteinTarget: 180,
  carbsConsumed: 0,
  carbsTarget: 220,
  fatsConsumed: 0,
  fatsTarget: 70
}

export function MacroDetailsCard({ data = DEFAULT_DATA }: MacroDetailsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const proteinPercent = Math.min(100, (data.proteinConsumed / data.proteinTarget) * 100)
  const carbsPercent = Math.min(100, (data.carbsConsumed / data.carbsTarget) * 100)
  const fatsPercent = Math.min(100, (data.fatsConsumed / data.fatsTarget) * 100)

  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left group"
          aria-expanded={isExpanded}
          aria-controls="macro-details-content"
        >
          <CardTitle className="text-white text-lg">Macro Details</CardTitle>
          <div className="text-iron-orange transition-transform">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
        </button>

        {!isExpanded && (
          <p className="text-xs text-gray-400 mt-1">
            Tap to view protein, carbs, and fats breakdown
          </p>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent id="macro-details-content" className="space-y-4">
          {/* Protein */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" aria-hidden="true" />
                <span className="text-sm font-semibold text-white">Protein</span>
              </div>
              <span className="text-sm text-gray-400">
                {data.proteinConsumed}g / {data.proteinTarget}g
              </span>
            </div>
            <Progress value={proteinPercent} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {data.proteinTarget - data.proteinConsumed > 0
                ? `${Math.round(data.proteinTarget - data.proteinConsumed)}g remaining`
                : 'Target reached!'}
            </p>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" aria-hidden="true" />
                <span className="text-sm font-semibold text-white">Carbs</span>
              </div>
              <span className="text-sm text-gray-400">
                {data.carbsConsumed}g / {data.carbsTarget}g
              </span>
            </div>
            <Progress value={carbsPercent} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {data.carbsTarget - data.carbsConsumed > 0
                ? `${Math.round(data.carbsTarget - data.carbsConsumed)}g remaining`
                : 'Target reached!'}
            </p>
          </div>

          {/* Fats */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" aria-hidden="true" />
                <span className="text-sm font-semibold text-white">Fats</span>
              </div>
              <span className="text-sm text-gray-400">
                {data.fatsConsumed}g / {data.fatsTarget}g
              </span>
            </div>
            <Progress value={fatsPercent} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              {data.fatsTarget - data.fatsConsumed > 0
                ? `${Math.round(data.fatsTarget - data.fatsConsumed)}g remaining`
                : 'Target reached!'}
            </p>
          </div>

          {/* Macro Education */}
          <div className="mt-4 p-3 bg-iron-black rounded-lg">
            <p className="text-xs text-gray-400 leading-relaxed">
              <span className="font-semibold text-white">Why macros matter:</span> Protein builds muscle,
              carbs fuel workouts, and fats support hormones. Balancing all three helps you reach your goals.
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
