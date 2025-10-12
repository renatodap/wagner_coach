'use client'

/**
 * Edit Dietary Preferences Modal
 *
 * Allows users to update:
 * - Dietary Preference
 * - Food Allergies
 * - Foods to Avoid
 * - Meals Per Day
 * - Cooks Regularly
 */

import { useState } from 'react'
import { X, Loader2, Apple, Plus, Trash2 } from 'lucide-react'
import { updateFullUserProfile, type FullUserProfile } from '@/lib/api/profile'

interface EditDietaryModalProps {
  profile: FullUserProfile
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedProfile: FullUserProfile) => void
  onError: (error: string) => void
}

export default function EditDietaryModal({
  profile,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: EditDietaryModalProps) {
  const [dietaryPreference, setDietaryPreference] = useState(profile.dietary_preference || 'none')
  const [foodAllergies, setFoodAllergies] = useState<string[]>(profile.food_allergies || [])
  const [foodsToAvoid, setFoodsToAvoid] = useState<string[]>(profile.foods_to_avoid || [])
  const [mealsPerDay, setMealsPerDay] = useState(profile.meals_per_day?.toString() || '3')
  const [cooksRegularly, setCooksRegularly] = useState(profile.cooks_regularly ?? true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Temporary inputs for adding new items
  const [newAllergy, setNewAllergy] = useState('')
  const [newAvoid, setNewAvoid] = useState('')

  if (!isOpen) return null

  const handleAddAllergy = () => {
    if (newAllergy.trim() && !foodAllergies.includes(newAllergy.trim())) {
      setFoodAllergies([...foodAllergies, newAllergy.trim()])
      setNewAllergy('')
    }
  }

  const handleRemoveAllergy = (index: number) => {
    setFoodAllergies(foodAllergies.filter((_, i) => i !== index))
  }

  const handleAddAvoid = () => {
    if (newAvoid.trim() && !foodsToAvoid.includes(newAvoid.trim())) {
      setFoodsToAvoid([...foodsToAvoid, newAvoid.trim()])
      setNewAvoid('')
    }
  }

  const handleRemoveAvoid = (index: number) => {
    setFoodsToAvoid(foodsToAvoid.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updates: any = {}

      if (dietaryPreference !== profile.dietary_preference) {
        updates.dietary_preference = dietaryPreference
      }

      // Compare arrays
      const allergiesChanged = JSON.stringify(foodAllergies.sort()) !== JSON.stringify((profile.food_allergies || []).sort())
      if (allergiesChanged) {
        updates.food_allergies = foodAllergies
      }

      const avoidsChanged = JSON.stringify(foodsToAvoid.sort()) !== JSON.stringify((profile.foods_to_avoid || []).sort())
      if (avoidsChanged) {
        updates.foods_to_avoid = foodsToAvoid
      }

      if (parseInt(mealsPerDay) !== profile.meals_per_day) {
        updates.meals_per_day = parseInt(mealsPerDay)
      }

      if (cooksRegularly !== profile.cooks_regularly) {
        updates.cooks_regularly = cooksRegularly
      }

      if (Object.keys(updates).length === 0) {
        onClose()
        return
      }

      const updatedProfile = await updateFullUserProfile(updates)
      onSuccess(updatedProfile)
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update dietary preferences'
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
            <Apple className="w-5 h-5 text-iron-orange" />
            <h2 className="font-heading text-xl text-iron-white uppercase">Edit Dietary Preferences</h2>
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
          {/* Dietary Preference */}
          <div>
            <label htmlFor="dietaryPreference" className="block text-sm font-medium text-iron-white mb-2">
              Dietary Preference
            </label>
            <select
              id="dietaryPreference"
              value={dietaryPreference}
              onChange={(e) => setDietaryPreference(e.target.value as any)}
              className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded focus:outline-none focus:border-iron-orange transition-colors"
            >
              <option value="none">None</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="pescatarian">Pescatarian</option>
              <option value="keto">Keto</option>
              <option value="paleo">Paleo</option>
            </select>
          </div>

          {/* Food Allergies */}
          <div>
            <label className="block text-sm font-medium text-iron-white mb-2">
              Food Allergies
            </label>
            <div className="space-y-2">
              {/* List of allergies */}
              {foodAllergies.length > 0 && (
                <div className="space-y-1">
                  {foodAllergies.map((allergy, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-iron-black border border-iron-gray rounded">
                      <span className="flex-1 text-sm text-iron-white">{allergy}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAllergy(index)}
                        className="p-1 hover:bg-red-900/20 rounded transition-colors"
                        aria-label={`Remove ${allergy}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new allergy */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
                  placeholder="Add allergy..."
                  className="flex-1 px-3 py-2 bg-iron-black border border-iron-gray text-iron-white text-sm rounded focus:outline-none focus:border-iron-orange transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddAllergy}
                  className="px-3 py-2 bg-iron-orange text-iron-black rounded hover:bg-orange-600 transition-colors"
                  aria-label="Add allergy"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Foods to Avoid */}
          <div>
            <label className="block text-sm font-medium text-iron-white mb-2">
              Foods to Avoid
            </label>
            <div className="space-y-2">
              {/* List of foods to avoid */}
              {foodsToAvoid.length > 0 && (
                <div className="space-y-1">
                  {foodsToAvoid.map((food, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-iron-black border border-iron-gray rounded">
                      <span className="flex-1 text-sm text-iron-white">{food}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAvoid(index)}
                        className="p-1 hover:bg-red-900/20 rounded transition-colors"
                        aria-label={`Remove ${food}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new food to avoid */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAvoid}
                  onChange={(e) => setNewAvoid(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAvoid())}
                  placeholder="Add food to avoid..."
                  className="flex-1 px-3 py-2 bg-iron-black border border-iron-gray text-iron-white text-sm rounded focus:outline-none focus:border-iron-orange transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddAvoid}
                  className="px-3 py-2 bg-iron-orange text-iron-black rounded hover:bg-orange-600 transition-colors"
                  aria-label="Add food to avoid"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Meals Per Day */}
          <div>
            <label htmlFor="mealsPerDay" className="block text-sm font-medium text-iron-white mb-2">
              Meals Per Day
            </label>
            <input
              type="number"
              id="mealsPerDay"
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(e.target.value)}
              min="1"
              max="8"
              className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded focus:outline-none focus:border-iron-orange transition-colors"
              placeholder="How many meals do you eat per day?"
            />
          </div>

          {/* Cooks Regularly */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cooksRegularly}
                onChange={(e) => setCooksRegularly(e.target.checked)}
                className="w-5 h-5 bg-iron-black border border-iron-gray rounded focus:outline-none focus:ring-2 focus:ring-iron-orange"
              />
              <span className="text-sm font-medium text-iron-white">I cook regularly</span>
            </label>
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
