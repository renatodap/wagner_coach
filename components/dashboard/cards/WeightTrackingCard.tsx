/**
 * Weight Tracking Card
 *
 * Shows current weight + weekly change with mini graph.
 * Priority: 7 (simple/balanced), 4 (detailed)
 *
 * Conditional: Only shows if shows_weight_card is true OR
 * 2+ weight logs in last 14 days (auto-detected)
 *
 * Variants:
 * - Simple/Balanced: Compact view with sparkline
 * - Detailed: Full graph with trend analysis
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDown, ArrowUp, Minus, Scale, TrendingDown, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface WeightData {
  currentWeight: number
  unit: 'lbs' | 'kg'
  weeklyChange: number
  startWeight?: number
  goalWeight?: number
  history: Array<{ date: string; weight: number }> // Last 7-14 days
}

interface WeightTrackingCardProps {
  variant: 'simple' | 'balanced' | 'detailed'
  data?: WeightData
}

// Default data
const DEFAULT_DATA: WeightData = {
  currentWeight: 185,
  unit: 'lbs',
  weeklyChange: -1.2,
  startWeight: 195,
  goalWeight: 175,
  history: [
    { date: '2025-10-04', weight: 187 },
    { date: '2025-10-05', weight: 186.5 },
    { date: '2025-10-06', weight: 186 },
    { date: '2025-10-07', weight: 185.8 },
    { date: '2025-10-08', weight: 186.2 },
    { date: '2025-10-09', weight: 185.5 },
    { date: '2025-10-10', weight: 185.0 }
  ]
}

export function WeightTrackingCard({ variant, data = DEFAULT_DATA }: WeightTrackingCardProps) {
  const isLosing = data.weeklyChange < 0
  const isGaining = data.weeklyChange > 0
  const isMaintaining = Math.abs(data.weeklyChange) < 0.2

  const getTrendIcon = () => {
    if (isMaintaining) return <Minus className="w-4 h-4" aria-hidden="true" />
    return isLosing ? <TrendingDown className="w-4 h-4" aria-hidden="true" /> : <TrendingUp className="w-4 h-4" aria-hidden="true" />
  }

  const getTrendColor = () => {
    if (isMaintaining) return 'text-gray-400'
    return isLosing ? 'text-green-500' : 'text-blue-500'
  }

  const getTrendText = () => {
    const change = Math.abs(data.weeklyChange)
    if (isMaintaining) return 'Maintaining'
    return isLosing ? `Down ${change}` : `Up ${change}`
  }

  const progressPercent = data.startWeight && data.goalWeight
    ? ((data.startWeight - data.currentWeight) / (data.startWeight - data.goalWeight)) * 100
    : 0

  if (variant === 'simple' || variant === 'balanced') {
    return (
      <Card className="bg-iron-gray border-iron-gray">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-iron-orange" aria-hidden="true" />
              <CardTitle className="text-white text-lg">Weight</CardTitle>
            </div>
            <Link
              href="/profile/weight"
              className="text-xs text-iron-orange hover:underline"
              aria-label="View weight history"
            >
              History
            </Link>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Weight */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-4xl font-bold text-white">
                {data.currentWeight}
              </div>
              <div className="text-sm text-gray-400">{data.unit}</div>
            </div>

            {/* Weekly Change */}
            <div className={`flex items-center gap-1 ${getTrendColor()} font-semibold`}>
              {getTrendIcon()}
              <span className="text-lg">
                {getTrendText()} {data.unit}
              </span>
            </div>
          </div>

          {/* Sparkline */}
          <div className="h-12 flex items-end gap-1">
            {data.history.slice(-7).map((point, index) => {
              const maxWeight = Math.max(...data.history.map(h => h.weight))
              const minWeight = Math.min(...data.history.map(h => h.weight))
              const range = maxWeight - minWeight || 1
              const heightPercent = ((point.weight - minWeight) / range) * 100
              const isLast = index === data.history.length - 1

              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col justify-end"
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      isLast ? 'bg-iron-orange' : 'bg-gray-600'
                    }`}
                    style={{ height: `${Math.max(heightPercent, 10)}%` }}
                    role="img"
                    aria-label={`${point.weight} ${data.unit} on ${point.date}`}
                  />
                </div>
              )
            })}
          </div>

          {/* Log Weight Button */}
          <Button
            className="w-full bg-iron-black hover:bg-iron-gray text-white border border-iron-gray"
            aria-label="Log your current weight"
          >
            <Scale className="w-4 h-4 mr-2" aria-hidden="true" />
            Log Weight
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-iron-orange" aria-hidden="true" />
            <CardTitle className="text-white text-lg">Weight Progress</CardTitle>
          </div>
          <Link
            href="/profile/weight"
            className="text-xs text-iron-orange hover:underline"
            aria-label="View detailed weight history and analytics"
          >
            View All
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-iron-black rounded-lg">
            <div className="text-2xl font-bold text-white">
              {data.currentWeight}
            </div>
            <div className="text-xs text-gray-400 mt-1">Current</div>
          </div>

          <div className="text-center p-3 bg-iron-black rounded-lg">
            <div className={`text-2xl font-bold ${getTrendColor()}`}>
              {isLosing ? '−' : '+'}{Math.abs(data.weeklyChange)}
            </div>
            <div className="text-xs text-gray-400 mt-1">This Week</div>
          </div>

          <div className="text-center p-3 bg-iron-black rounded-lg">
            <div className="text-2xl font-bold text-white">
              {data.goalWeight || '--'}
            </div>
            <div className="text-xs text-gray-400 mt-1">Goal</div>
          </div>
        </div>

        {/* Progress to Goal */}
        {data.startWeight && data.goalWeight && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress to Goal</span>
              <span>{Math.round(progressPercent)}%</span>
            </div>
            <div className="w-full bg-iron-black rounded-full h-3">
              <div
                className="bg-gradient-to-r from-iron-orange to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${Math.round(progressPercent)}% progress to goal weight`}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start: {data.startWeight} {data.unit}</span>
              <span>Lost: {(data.startWeight - data.currentWeight).toFixed(1)} {data.unit}</span>
            </div>
          </div>
        )}

        {/* Full Graph */}
        <div className="h-24 flex items-end gap-2">
          {data.history.map((point, index) => {
            const maxWeight = Math.max(...data.history.map(h => h.weight))
            const minWeight = Math.min(...data.history.map(h => h.weight))
            const range = maxWeight - minWeight || 1
            const heightPercent = ((point.weight - minWeight) / range) * 100
            const isLast = index === data.history.length - 1

            return (
              <div
                key={point.date}
                className="flex-1 flex flex-col justify-end group relative"
              >
                {/* Tooltip */}
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-iron-black px-2 py-1 rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {point.weight} {data.unit}
                </div>

                <div
                  className={`w-full rounded-t transition-all ${
                    isLast ? 'bg-iron-orange' : 'bg-gray-600 group-hover:bg-gray-500'
                  }`}
                  style={{ height: `${Math.max(heightPercent, 15)}%` }}
                  role="img"
                  aria-label={`${point.weight} ${data.unit} on ${point.date}`}
                />
              </div>
            )
          })}
        </div>

        {/* Log Weight Button */}
        <Button
          className="w-full bg-iron-orange hover:bg-orange-600 text-white font-semibold"
          aria-label="Log your current weight"
        >
          <Scale className="w-4 h-4 mr-2" aria-hidden="true" />
          Log Weight
        </Button>
      </CardContent>
    </Card>
  )
}
