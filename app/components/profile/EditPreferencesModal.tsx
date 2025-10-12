'use client'

/**
 * Edit Preferences Modal
 *
 * Allows users to update:
 * - Unit System (Metric/Imperial)
 * - Timezone
 */

import { useState } from 'react'
import { X, Loader2, Settings } from 'lucide-react'
import { updateFullUserProfile, type FullUserProfile } from '@/lib/api/profile'
import { UNIT_SYSTEM_OPTIONS, TIMEZONE_OPTIONS } from '@/lib/constants/profile'

interface EditPreferencesModalProps {
  profile: FullUserProfile
  isOpen: boolean
  onClose: () => void
  onSuccess: (updatedProfile: FullUserProfile) => void
  onError: (error: string) => void
}

export default function EditPreferencesModal({
  profile,
  isOpen,
  onClose,
  onSuccess,
  onError,
}: EditPreferencesModalProps) {
  const [unitSystem, setUnitSystem] = useState(profile.unit_system || 'imperial')
  const [timezone, setTimezone] = useState(profile.timezone || 'America/New_York')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const updates: any = {}

      if (unitSystem !== profile.unit_system) {
        updates.unit_system = unitSystem
      }
      if (timezone !== profile.timezone) {
        updates.timezone = timezone
      }

      if (Object.keys(updates).length === 0) {
        onClose()
        return
      }

      const updatedProfile = await updateFullUserProfile(updates)
      onSuccess(updatedProfile)
      onClose()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update preferences'
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
            <Settings className="w-5 h-5 text-iron-orange" />
            <h2 className="font-heading text-xl text-iron-white uppercase">Edit Preferences</h2>
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
          {/* Unit System */}
          <div>
            <label htmlFor="unitSystem" className="block text-sm font-medium text-iron-white mb-2">
              Unit System
            </label>
            <select
              id="unitSystem"
              value={unitSystem}
              onChange={(e) => setUnitSystem(e.target.value as any)}
              className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded focus:outline-none focus:border-iron-orange transition-colors"
            >
              {UNIT_SYSTEM_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-iron-gray">
              Note: Current app displays metric units. Imperial display coming soon.
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-iron-white mb-2">
              Timezone
            </label>
            <select
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 bg-iron-black border border-iron-gray text-iron-white rounded focus:outline-none focus:border-iron-orange transition-colors"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-iron-gray">
              Used for meal logging and activity tracking
            </p>
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
