'use client'

/**
 * MacroProgressRings - Circular Progress Visualization
 *
 * Displays daily macro progress with animated rings.
 */

import { useEffect, useState } from 'react'
import type { DailyMacroProgress } from '@/types/coach-v3'

interface MacroProgressRingsProps {
  progress: DailyMacroProgress
}

interface RingProps {
  percentage: number
  color: string
  label: string
  current: number
  goal: number
  unit: string
}

function ProgressRing({ percentage, color, label, current, goal, unit }: RingProps) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)

  useEffect(() => {
    // Animate from 0 to actual percentage
    const timeout = setTimeout(() => {
      setAnimatedPercentage(Math.min(percentage, 100))
    }, 100)
    return () => clearTimeout(timeout)
  }, [percentage])

  // Circle parameters
  const size = 120
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedPercentage / 100) * circumference

  // Color based on percentage
  const ringColor =
    percentage >= 100
      ? 'text-green-500'
      : percentage >= 80
      ? color
      : 'text-yellow-500'

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Ring */}
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-zinc-800"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${ringColor} transition-all duration-1000 ease-out`}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-white">
            {Math.round(percentage)}%
          </span>
        </div>
      </div>

      {/* Label & Values */}
      <div className="text-center">
        <p className="text-sm font-semibold text-iron-white">{label}</p>
        <p className="text-xs text-iron-gray">
          {Math.round(current)} / {Math.round(goal)} {unit}
        </p>
      </div>
    </div>
  )
}

export function MacroProgressRings({ progress }: MacroProgressRingsProps) {
  return (
    <div className="bg-gradient-to-br from-zinc-900/80 to-neutral-900/80 backdrop-blur-sm rounded-2xl p-6 border border-zinc-800">
      <h3 className="text-lg font-bold text-white mb-6">Today's Progress</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <ProgressRing
          percentage={progress.percentage.calories}
          color="text-blue-400"
          label="Calories"
          current={progress.current.calories}
          goal={progress.goals.calories}
          unit="kcal"
        />

        <ProgressRing
          percentage={progress.percentage.protein}
          color="text-green-400"
          label="Protein"
          current={progress.current.protein_g}
          goal={progress.goals.protein_g}
          unit="g"
        />

        <ProgressRing
          percentage={progress.percentage.carbs}
          color="text-purple-400"
          label="Carbs"
          current={progress.current.carbs_g}
          goal={progress.goals.carbs_g}
          unit="g"
        />

        <ProgressRing
          percentage={progress.percentage.fats}
          color="text-amber-400"
          label="Fats"
          current={progress.current.fat_g}
          goal={progress.goals.fat_g}
          unit="g"
        />
      </div>

      {/* Overall Status */}
      <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
        {progress.percentage.calories >= 90 && progress.percentage.calories <= 110 ? (
          <p className="text-green-400 font-medium">
            🎯 Great job! You're right on track with your goals today.
          </p>
        ) : progress.percentage.calories < 50 ? (
          <p className="text-yellow-400 font-medium">
            📈 You have room for more calories today. Keep going!
          </p>
        ) : progress.percentage.calories > 110 ? (
          <p className="text-orange-400 font-medium">
            ⚠️ You've exceeded your calorie goal for today.
          </p>
        ) : (
          <p className="text-iron-gray font-medium">
            Keep logging your meals to track progress
          </p>
        )}
      </div>
    </div>
  )
}
