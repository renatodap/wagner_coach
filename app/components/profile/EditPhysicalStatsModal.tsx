'use client'

/**
 * Edit Physical Stats Modal
 *
 * Allows users to update:
 * - Age
 * - Height
 * - Current Weight
 * - Goal Weight
 *
 * Note: Biological sex is not editable as it's used for BMR calculations
 * and should not change after onboarding.
 */

import { useState } from 'react'
import { X, Loader2, Scale } from 'lucide-react'
import { updateFullUserProfile, type FullUserProfile } from '@/lib/api/profile'

interface EditPhysicalStatsModalProps {
  profile: FullUserProfile
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedProfile: FullUserProfile) => void
  onError: (error: string) => void
}

export default function EditPhysicalStatsModal({
  profile,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: EditPhysicalStatsModalProps) {
  const [age, setAge] = useState(profile.age?.toString() || '')
  const [heightCm, setHeightCm] = useState(profile.height_cm?.toString() || '')
  const [currentWeightKg, setCurrentWeightKg] = useState(profile.current_weight_kg?.toString() || '')
  const [goalWeightKg, setGoalWeightKg] = useState(profile.goal_weight_kg?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updates: any = {}

      if (age && parseInt(age) !== profile.age) {
        updates.age = parseInt(age)
      }
      if (heightCm && parseFloat(heightCm) !== profile.height_cm) {
        updates.height_cm = parseFloat(heightCm)
      }
      if (currentWeightKg && parseFloat(currentWeightKg) !== profile.current_weight_kg) {
        updates.current_weight_kg = parseFloat(currentWeightKg)
      }
      if (goalWeightKg && parseFloat(goalWeightKg) !== profile.goal_weight_kg) {
        updates.goal_weight_kg = parseFloat(goalWeightKg)
      }

      if (Object.keys(updates).length === 0) {
        onClose()
        return
      }

      const updatedProfile = await updateFullUserProfile(updates)
      onSuccess(updatedProfile)
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update physical stats'
      onError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <div className="bg-iron-dark-gray border border-iron-gray max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-iron-dark-gray border-b border-iron-gray p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-iron-orange" />
            <h2 className="font-heading text-xl text-iron-white uppercase">Edit Physical Stats</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-iron-gray/20 rounded transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-iron-gray" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Message */}
          <div className="p-3 bg-iron-orange/10 border border-iron-orange/30 rounded">
            <p className="text-sm text-iron-white">
              Changes to physical stats will automatically recalculate your macro targets.
            </p>
          </div>

          {/* Age */}
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-iron-white mb-2">
              Age (years)
            </label>
            <input
              type="number"
              id="age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="13"
              max="120"
              className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="Enter your age"
            />
          </div>

          {/* Height */}
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-iron-white mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              id="height"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              min="100"
              max="300"
              step="0.1"
              className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="Enter your height"
            />
          </div>

          {/* Current Weight */}
          <div>
            <label htmlFor="currentWeight" className="block text-sm font-medium text-iron-white mb-2">
              Current Weight (kg)
            </label>
            <input
              type="number"
              id="currentWeight"
              value={currentWeightKg}
              onChange={(e) => setCurrentWeightKg(e.target.value)}
              min="30"
              max="300"
              step="0.1"
              className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="Enter your current weight"
            />
          </div>

          {/* Goal Weight */}
          <div>
            <label htmlFor="goalWeight" className="block text-sm font-medium text-iron-white mb-2">
              Goal Weight (kg)
            </label>
            <input
              type="number"
              id="goalWeight"
              value={goalWeightKg}
              onChange={(e) => setGoalWeightKg(e.target.value)}
              min="30"
              max="300"
              step="0.1"
              className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="Enter your goal weight"
            />
          </div>

          {/* Biological Sex (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-iron-gray mb-2">
              Biological Sex (cannot be changed)
            </label>
            <div className="px-4 py-3 bg-iron-gray/10 border border-iron-gray/30 text-iron-gray rounded">
              {profile.biological_sex ? profile.biological_sex.charAt(0).toUpperCase() + profile.biological_sex.slice(1) : 'Not set'}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-iron-gray text-iron-white font-heading uppercase tracking-wider hover:bg-iron-gray/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-iron-orange text-iron-black font-heading uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
