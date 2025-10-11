/**
 * Recovery Metrics Card
 *
 * Shows sleep hours, soreness level, readiness score.
 * Priority: 18
 *
 * Conditional: Only shows if shows_recovery_card is true OR
 * 3+ recovery logs in last 7 days (auto-detected)
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Battery, BatteryCharging, BatteryFull, BatteryLow, Heart, Moon } from 'lucide-react'
import Link from 'next/link'

interface RecoveryData {
  sleepHours: number
  sleepQuality?: 1 | 2 | 3 | 4 | 5 // 1=poor, 5=excellent
  sorenessLevel: 1 | 2 | 3 | 4 | 5 // 1=none, 5=severe
  readinessScore: number // 0-100
  restingHeartRate?: number
}

interface RecoveryMetricsCardProps {
  data?: RecoveryData
}

const DEFAULT_DATA: RecoveryData = {
  sleepHours: 0,
  sorenessLevel: 3,
  readinessScore: 0
}

export function RecoveryMetricsCard({ data = DEFAULT_DATA }: RecoveryMetricsCardProps) {
  const getReadinessIcon = (score: number) => {
    if (score >= 80) return <BatteryFull className="w-5 h-5 text-green-500" aria-hidden="true" />
    if (score >= 60) return <BatteryCharging className="w-5 h-5 text-yellow-500" aria-hidden="true" />
    if (score >= 40) return <BatteryLow className="w-5 h-5 text-orange-500" aria-hidden="true" />
    return <Battery className="w-5 h-5 text-red-500" aria-hidden="true" />
  }

  const getReadinessColor = (score: number): string => {
    if (score >= 80) return 'text-green-500'
    if (score >= 60) return 'text-yellow-500'
    if (score >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getReadinessMessage = (score: number): string => {
    if (score >= 80) return 'Ready to train hard'
    if (score >= 60) return 'Ready for moderate training'
    if (score >= 40) return 'Consider light training'
    return 'Focus on recovery today'
  }

  const getSorenessText = (level: number): string => {
    switch (level) {
      case 1: return 'None'
      case 2: return 'Mild'
      case 3: return 'Moderate'
      case 4: return 'High'
      case 5: return 'Severe'
      default: return 'Unknown'
    }
  }

  const getSorenessColor = (level: number): string => {
    if (level <= 2) return 'text-green-500'
    if (level === 3) return 'text-yellow-500'
    return 'text-red-500'
  }

  const hasData = data.sleepHours > 0 || data.readinessScore > 0

  if (!hasData) {
    return (
      <Card className="bg-iron-gray border-iron-gray">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-iron-orange" aria-hidden="true" />
              <CardTitle className="text-white text-lg">Recovery</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Moon className="w-12 h-12 text-gray-600 mx-auto mb-3" aria-hidden="true" />
            <p className="text-gray-400 text-sm mb-3">No recovery data logged today</p>
            <Link href="/recovery/log">
              <Button
                className="bg-iron-orange hover:bg-orange-600 text-white"
                aria-label="Log your recovery metrics"
              >
                Log Recovery
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-iron-orange" aria-hidden="true" />
            <CardTitle className="text-white text-lg">Recovery</CardTitle>
          </div>
          <Link
            href="/recovery"
            className="text-xs text-iron-orange hover:underline"
            aria-label="View recovery history"
          >
            History
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Readiness Score */}
        {data.readinessScore > 0 && (
          <div className="bg-iron-black p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Readiness</span>
              {getReadinessIcon(data.readinessScore)}
            </div>
            <div className={`text-4xl font-bold ${getReadinessColor(data.readinessScore)}`}>
              {data.readinessScore}%
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {getReadinessMessage(data.readinessScore)}
            </p>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Sleep */}
          <div className="bg-iron-black p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Moon className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <span className="text-xs text-gray-400">Sleep</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {data.sleepHours}h
            </div>
            {data.sleepQuality && (
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < data.sleepQuality! ? 'bg-blue-400' : 'bg-gray-600'
                    }`}
                    aria-hidden="true"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Soreness */}
          <div className="bg-iron-black p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" aria-hidden="true" />
              <span className="text-xs text-gray-400">Soreness</span>
            </div>
            <div className={`text-lg font-bold ${getSorenessColor(data.sorenessLevel)}`}>
              {getSorenessText(data.sorenessLevel)}
            </div>
            <div className="flex gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < data.sorenessLevel ? 'bg-orange-400' : 'bg-gray-600'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Resting Heart Rate */}
        {data.restingHeartRate && (
          <div className="bg-iron-black p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-400" aria-hidden="true" />
                <span className="text-xs text-gray-400">Resting HR</span>
              </div>
              <div className="text-xl font-bold text-white">
                {data.restingHeartRate} bpm
              </div>
            </div>
          </div>
        )}

        {/* Update Button */}
        <Link href="/recovery/log">
          <Button
            variant="outline"
            className="w-full border-iron-gray bg-iron-black hover:bg-iron-gray text-white"
            aria-label="Update recovery metrics"
          >
            Update Recovery
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
