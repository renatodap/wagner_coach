'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight: number
}

export default function LogWorkoutPage() {
  const router = useRouter()
  const [workoutName, setWorkoutName] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([
    { id: '1', name: '', sets: 3, reps: 10, weight: 0 }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const addExercise = () => {
    setExercises([
      ...exercises,
      { id: Date.now().toString(), name: '', sets: 3, reps: 10, weight: 0 }
    ])
  }

  const removeExercise = (id: string) => {
    if (exercises.length > 1) {
      setExercises(exercises.filter(ex => ex.id !== id))
    }
  }

  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!workoutName.trim()) {
      setError('Please enter a workout name')
      return
    }
    
    const validExercises = exercises.filter(ex => ex.name.trim())
    if (validExercises.length === 0) {
      setError('Please add at least one exercise')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // For INCREMENT 3: Just simulate save with console log
      // In a real implementation, this would call a backend API
      console.log('Saving workout:', {
        name: workoutName,
        exercises: validExercises,
        timestamp: new Date().toISOString()
      })

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setSuccess(true)
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/workouts')
      }, 2000)

    } catch (err) {
      console.error('Error saving workout:', err)
      setError(err instanceof Error ? err.message : 'Failed to save workout')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg text-center">
          <p className="text-lg font-bold mb-2">✅ Workout Saved!</p>
          <p>Redirecting to workouts page...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Log Workout</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workout Name */}
        <div>
          <Label htmlFor="workoutName">Workout Name</Label>
          <Input
            id="workoutName"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="e.g., Push Day, Full Body, Leg Day"
            required
          />
        </div>

        {/* Exercises */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Exercises</h2>
            <Button type="button" onClick={addExercise} variant="outline">
              + Add Exercise
            </Button>
          </div>

          <div className="space-y-4">
            {exercises.map((exercise, index) => (
              <div key={exercise.id} className="border p-4 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">Exercise {index + 1}</h3>
                  {exercises.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(exercise.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor={`ex-name-${exercise.id}`}>Exercise Name</Label>
                    <Input
                      id={`ex-name-${exercise.id}`}
                      value={exercise.name}
                      onChange={(e) => updateExercise(exercise.id, 'name', e.target.value)}
                      placeholder="e.g., Bench Press, Squats"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`ex-sets-${exercise.id}`}>Sets</Label>
                    <Input
                      id={`ex-sets-${exercise.id}`}
                      type="number"
                      min="1"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor={`ex-reps-${exercise.id}`}>Reps</Label>
                    <Input
                      id={`ex-reps-${exercise.id}`}
                      type="number"
                      min="1"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor={`ex-weight-${exercise.id}`}>Weight (lbs)</Label>
                    <Input
                      id={`ex-weight-${exercise.id}`}
                      type="number"
                      min="0"
                      step="2.5"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Saving...' : 'Save Workout'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
