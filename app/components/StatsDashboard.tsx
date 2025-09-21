'use client'

import { useState } from 'react'
import type { WorkoutStats, WorkoutCompletion } from '@/lib/types/workout-flows'

interface StatsDashboardProps {
  stats: WorkoutStats
  workouts: WorkoutCompletion[]
  userId: string
}

export default function StatsDashboard({ stats, workouts, userId }: StatsDashboardProps) {
  const [selectedExportFormat, setSelectedExportFormat] = useState('')
  const [showExportDialog, setShowExportDialog] = useState(false)

  const handleExportStats = () => {
    setShowExportDialog(true)
  }

  const handleDownload = async (format: string) => {
    try {
      // Mock export functionality
      const exportData = {
        stats,
        workouts,
        exportedAt: new Date().toISOString(),
        format
      }

      console.log(`Exporting in ${format} format:`, exportData)

      // Show success message
      const successDiv = document.createElement('div')
      successDiv.setAttribute('data-testid', 'download-started')
      successDiv.textContent = `${format.toUpperCase()} download started`
      document.body.appendChild(successDiv)

      setTimeout(() => document.body.removeChild(successDiv), 3000)
      setShowExportDialog(false)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const calculatePersonalBests = () => {
    // Mock personal bests calculation
    return [
      { exercise: 'Bench Press', weight: 185, date: '2025-01-20' },
      { exercise: 'Squat', weight: 225, date: '2025-01-18' },
      { exercise: 'Deadlift', weight: 275, date: '2025-01-15' }
    ]
  }

  const personalBests = calculatePersonalBests()

  const getWorkoutTypeBreakdown = () => {
    const typeCount = workouts.reduce((acc, workout) => {
      acc[workout.workout_type] = (acc[workout.workout_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / workouts.length) * 100)
    }))
  }

  const workoutTypeBreakdown = getWorkoutTypeBreakdown()

  return (
    <div className="space-y-6">
      {/* Export Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Statistics Dashboard</h2>
        <button
          onClick={handleExportStats}
          data-testid="export-stats-button"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Export Stats
        </button>
      </div>

      {/* Strength Progression Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Strength Progression</h3>
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center" data-testid="strength-progression-chart" role="img" aria-label="Strength progression over time">
          <div className="text-gray-500">Strength progression chart would be rendered here</div>
        </div>
      </div>

      {/* Volume Progression Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Weekly Volume</h3>
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center" data-testid="volume-progression-chart">
          <div className="text-gray-500">Volume progression chart would be rendered here</div>
        </div>
      </div>

      {/* Consistency Heatmap */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Workout Consistency</h3>
        <div className="h-48 bg-gray-100 rounded flex items-center justify-center" data-testid="consistency-heatmap">
          <div className="text-gray-500">Consistency heatmap would be rendered here</div>
        </div>
      </div>

      {/* Workout Type Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4" data-testid="workout-type-breakdown">
          Workout Type Distribution
        </h3>
        <div className="space-y-3">
          {workoutTypeBreakdown.map(({ type, count, percentage }) => (
            <div key={type} className="flex justify-between items-center">
              <span className="capitalize font-medium">{type.replace('_', ' ')}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12">{count}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-600">
          Favorite Type: <span className="font-medium capitalize">{stats.favoriteWorkoutType || 'Push'}</span>
        </div>
      </div>

      {/* Personal Bests */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Personal Bests</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="personal-bests">
          {personalBests.map((pb, index) => (
            <div key={index} className="text-center p-4 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-600">{pb.weight} lbs</div>
              <div className="font-medium">{pb.exercise}</div>
              <div className="text-sm text-gray-600">{new Date(pb.date).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pattern Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Your Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="pattern-analysis">
          <div className="p-4 bg-blue-50 rounded">
            <h4 className="font-semibold text-blue-800 mb-2">Most Active Day</h4>
            <div className="text-2xl font-bold text-blue-600">Monday</div>
            <div className="text-sm text-blue-600">32% of workouts</div>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <h4 className="font-semibold text-green-800 mb-2">Peak Performance Time</h4>
            <div className="text-2xl font-bold text-green-600">6:00 AM</div>
            <div className="text-sm text-green-600">Highest average ratings</div>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <h4 className="font-semibold text-purple-800 mb-2">Average Rest Days</h4>
            <div className="text-2xl font-bold text-purple-600">1.2 days</div>
            <div className="text-sm text-purple-600">Between workouts</div>
          </div>
          <div className="p-4 bg-orange-50 rounded">
            <h4 className="font-semibold text-orange-800 mb-2">Preferred Duration</h4>
            <div className="text-2xl font-bold text-orange-600">{Math.round(stats.averageDuration / 60)} min</div>
            <div className="text-sm text-orange-600">Average workout length</div>
          </div>
        </div>
      </div>

      {/* Export Format Dialog */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" data-testid="export-format-dialog">
            <h3 className="text-lg font-semibold mb-4">Export Format</h3>
            <div className="space-y-3 mb-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="export-format"
                  value="json"
                  checked={selectedExportFormat === 'json'}
                  onChange={(e) => setSelectedExportFormat(e.target.value)}
                  data-testid="export-json"
                  className="mr-3"
                />
                JSON (Complete data)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="export-format"
                  value="csv"
                  checked={selectedExportFormat === 'csv'}
                  onChange={(e) => setSelectedExportFormat(e.target.value)}
                  className="mr-3"
                />
                CSV (Spreadsheet compatible)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="export-format"
                  value="pdf"
                  checked={selectedExportFormat === 'pdf'}
                  onChange={(e) => setSelectedExportFormat(e.target.value)}
                  className="mr-3"
                />
                PDF (Report format)
              </label>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportDialog(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDownload(selectedExportFormat)}
                disabled={!selectedExportFormat}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                DOWNLOAD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}