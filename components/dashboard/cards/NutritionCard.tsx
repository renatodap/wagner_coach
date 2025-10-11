/**
 * Nutrition Card
 *
 * Displays calorie and macro tracking with variants:
 * - Simple: Calories only (large circle)
 * - Balanced: Calories + macro bars
 * - Detailed: Calories + macro circles + micronutrients
 *
 * Priority: 11 (simple), 8 (balanced), 7 (detailed)
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'

interface NutritionData {
  caloriesConsumed: number
  caloriesTarget: number
  proteinConsumed: number
  proteinTarget: number
  carbsConsumed: number
  carbsTarget: number
  fatsConsumed: number
  fatsTarget: number
}

interface NutritionCardProps {
  variant: 'simple' | 'balanced' | 'detailed'
  data?: NutritionData
}

// Default data for when user hasn't logged anything yet
const DEFAULT_DATA: NutritionData = {
  caloriesConsumed: 0,
  caloriesTarget: 2200,
  proteinConsumed: 0,
  proteinTarget: 180,
  carbsConsumed: 0,
  carbsTarget: 220,
  fatsConsumed: 0,
  fatsTarget: 70
}

export function NutritionCard({ variant, data = DEFAULT_DATA }: NutritionCardProps) {
  const caloriePercent = Math.min(100, (data.caloriesConsumed / data.caloriesTarget) * 100)
  const proteinPercent = Math.min(100, (data.proteinConsumed / data.proteinTarget) * 100)
  const carbsPercent = Math.min(100, (data.carbsConsumed / data.carbsTarget) * 100)
  const fatsPercent = Math.min(100, (data.fatsConsumed / data.fatsTarget) * 100)

  const remaining = data.caloriesTarget - data.caloriesConsumed

  if (variant === 'simple') {
    return (
      <Card className="bg-iron-gray border-iron-gray">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Today's Nutrition</CardTitle>
            <Link
              href="/nutrition"
              className="text-xs text-iron-orange hover:underline"
              aria-label="View nutrition history"
            >
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {/* Large Calorie Circle */}
          <div className="flex flex-col items-center py-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Background circle */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-iron-black"
                />
                {/* Progress circle */}
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - caloriePercent / 100)}`}
                  className="text-iron-orange transition-all duration-500"
                />
              </svg>

              {/* Calorie text */}
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {data.caloriesConsumed}
                </div>
                <div className="text-xs text-gray-400">
                  of {data.caloriesTarget}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-300">
                {remaining > 0 ? (
                  <>
                    <span className="font-semibold text-white">{remaining} calories</span> remaining
                  </>
                ) : (
                  <span className="font-semibold text-iron-orange">Target reached!</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (variant === 'balanced') {
    return (
      <Card className="bg-iron-gray border-iron-gray">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">Today's Nutrition</CardTitle>
            <Link
              href="/nutrition"
              className="text-xs text-iron-orange hover:underline"
              aria-label="View nutrition history"
            >
              View All
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Calories */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-white">Calories</span>
              <span className="text-sm text-gray-400">
                {data.caloriesConsumed} / {data.caloriesTarget}
              </span>
            </div>
            <Progress value={caloriePercent} className="h-3" />
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {/* Protein */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Protein</div>
              <div className="text-lg font-bold text-white">{data.proteinConsumed}g</div>
              <div className="text-xs text-gray-500">of {data.proteinTarget}g</div>
              <Progress value={proteinPercent} className="h-1.5 mt-2" />
            </div>

            {/* Carbs */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Carbs</div>
              <div className="text-lg font-bold text-white">{data.carbsConsumed}g</div>
              <div className="text-xs text-gray-500">of {data.carbsTarget}g</div>
              <Progress value={carbsPercent} className="h-1.5 mt-2" />
            </div>

            {/* Fats */}
            <div className="text-center">
              <div className="text-xs text-gray-400 mb-1">Fats</div>
              <div className="text-lg font-bold text-white">{data.fatsConsumed}g</div>
              <div className="text-xs text-gray-500">of {data.fatsTarget}g</div>
              <Progress value={fatsPercent} className="h-1.5 mt-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" aria-hidden="true" />
            Today's Nutrition
          </CardTitle>
          <Link
            href="/nutrition"
            className="text-xs text-iron-orange hover:underline"
            aria-label="View detailed nutrition history"
          >
            View Details
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Calories */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-base font-semibold text-white">Calories</span>
            <span className="text-sm text-gray-400">
              {data.caloriesConsumed} / {data.caloriesTarget} ({Math.round(caloriePercent)}%)
            </span>
          </div>
          <Progress value={caloriePercent} className="h-3" />
          {remaining > 0 && (
            <p className="text-xs text-gray-400 mt-1">{remaining} calories remaining</p>
          )}
        </div>

        {/* Macro Circles */}
        <div className="grid grid-cols-3 gap-4">
          {/* Protein */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-iron-black"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - proteinPercent / 100)}`}
                  className="text-blue-500 transition-all duration-500"
                />
              </svg>
              <div className="text-center">
                <div className="text-sm font-bold text-white">{data.proteinConsumed}g</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">Protein</div>
            <div className="text-xs text-gray-500">{data.proteinTarget}g</div>
          </div>

          {/* Carbs */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-iron-black"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - carbsPercent / 100)}`}
                  className="text-green-500 transition-all duration-500"
                />
              </svg>
              <div className="text-center">
                <div className="text-sm font-bold text-white">{data.carbsConsumed}g</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">Carbs</div>
            <div className="text-xs text-gray-500">{data.carbsTarget}g</div>
          </div>

          {/* Fats */}
          <div className="flex flex-col items-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  className="text-iron-black"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  stroke="currentColor"
                  strokeWidth="6"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 36}`}
                  strokeDashoffset={`${2 * Math.PI * 36 * (1 - fatsPercent / 100)}`}
                  className="text-yellow-500 transition-all duration-500"
                />
              </svg>
              <div className="text-center">
                <div className="text-sm font-bold text-white">{data.fatsConsumed}g</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-1">Fats</div>
            <div className="text-xs text-gray-500">{data.fatsTarget}g</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
