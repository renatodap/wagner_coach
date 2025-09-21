'use client'

import { useState, useEffect } from 'react'

interface SetTimerProps {
  isRunning: boolean
  onPause: () => void
  onResume: () => void
  restSeconds: number
}

export default function SetTimer({ isRunning, onPause, onResume, restSeconds }: SetTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(restSeconds)
  const [isRestTimer, setIsRestTimer] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && isRestTimer && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, isRestTimer, timeRemaining])

  const startRestTimer = () => {
    setTimeRemaining(restSeconds)
    setIsRestTimer(true)
  }

  const stopRestTimer = () => {
    setIsRestTimer(false)
    setTimeRemaining(restSeconds)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getTimerColor = () => {
    const percentage = (timeRemaining / restSeconds) * 100
    if (percentage > 50) return 'text-green-600'
    if (percentage > 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4" data-testid="set-timer">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-4">Rest Timer</h3>

        {isRestTimer ? (
          <div>
            <div className={`text-4xl font-bold mb-4 ${getTimerColor()}`}>
              {formatTime(timeRemaining)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  timeRemaining / restSeconds > 0.5 ? 'bg-green-500' :
                  timeRemaining / restSeconds > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${(timeRemaining / restSeconds) * 100}%` }}
              />
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={stopRestTimer}
                data-testid="stop-timer"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Skip Rest
              </button>
              {isRunning ? (
                <button
                  onClick={onPause}
                  data-testid="pause-timer"
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={onResume}
                  data-testid="resume-timer"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Resume
                </button>
              )}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-2xl font-semibold mb-4 text-gray-600">
              {formatTime(restSeconds)}
            </div>
            <button
              onClick={startRestTimer}
              data-testid="start-timer"
              className="px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
            >
              Start Rest Timer
            </button>
          </div>
        )}

        {timeRemaining === 0 && isRestTimer && (
          <div className="mt-4 p-3 bg-green-100 text-green-800 rounded">
            <div className="font-semibold">Rest Complete!</div>
            <div className="text-sm">Ready for your next set</div>
          </div>
        )}
      </div>
    </div>
  )
}