'use client'

/**
 * Profile Page - Comprehensive View
 *
 * Displays ALL user profile data from onboarding including:
 * - Basic info (name, email)
 * - Physical stats (age, sex, height, weight, goals)
 * - Training & Activity (experience level, activity level, workout frequency)
 * - Nutrition Plan (macro targets, TDEE, calorie goals)
 * - Dietary Preferences (dietary restrictions, allergies, meal frequency)
 * - Lifestyle (sleep, stress, cooking habits)
 * - Consultation Results (if completed)
 * - Preferences (unit system, timezone)
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Loader2,
  User,
  Activity,
  Apple,
  Moon,
  Settings,
  LogOut,
  Edit2,
  TrendingUp,
  Calendar,
  Utensils,
  Heart,
  Scale,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import BottomNavigation from '@/app/components/BottomNavigation'
import { getFullUserProfile, type FullUserProfile } from '@/lib/api/profile'
import { logout } from '@/lib/api/auth'
import EditPhysicalStatsModal from '@/app/components/profile/EditPhysicalStatsModal'
import EditGoalsModal from '@/app/components/profile/EditGoalsModal'
import EditDietaryModal from '@/app/components/profile/EditDietaryModal'
import EditLifestyleModal from '@/app/components/profile/EditLifestyleModal'
import EditPreferencesModal from '@/app/components/profile/EditPreferencesModal'
import Toast from '@/app/components/shared/Toast'
import {
  formatGoal,
  formatActivityLevel,
  formatBiologicalSex,
  formatExperienceLevel,
  formatDietaryPreference,
  formatUnitSystem,
  formatStressLevel,
} from '@/lib/constants/profile'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<FullUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Accordion state for collapsible sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['basic', 'macros']) // Expand basic info and macros by default
  )

  // Modal states
  const [showPhysicalModal, setShowPhysicalModal] = useState(false)
  const [showGoalsModal, setShowGoalsModal] = useState(false)
  const [showDietaryModal, setShowDietaryModal] = useState(false)
  const [showLifestyleModal, setShowLifestyleModal] = useState(false)
  const [showPreferencesModal, setShowPreferencesModal] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await getFullUserProfile()
      setProfile(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile'
      setError(errorMessage)
      console.error('Profile load error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    logout()
    router.push('/auth')
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  // Modal handlers
  const handleUpdateSuccess = (updatedProfile: FullUserProfile) => {
    setProfile(updatedProfile)
    setToast({ message: 'Profile updated successfully!', type: 'success' })
  }

  const handleUpdateError = (errorMessage: string) => {
    setToast({ message: errorMessage, type: 'error' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-iron-orange" />
          <p className="text-iron-gray">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md px-4">
            <h2 className="font-heading text-2xl text-iron-orange mb-2 uppercase">Unable to Load Profile</h2>
            <p className="text-iron-gray mb-6">{error}</p>
            <button
              onClick={loadProfile}
              className="bg-iron-orange text-iron-black font-heading px-6 py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  // Helper component for collapsible section
  const CollapsibleSection = ({
    id,
    title,
    icon: Icon,
    onEdit,
    children,
  }: {
    id: string
    title: string
    icon: React.ElementType
    onEdit?: () => void
    children: React.ReactNode
  }) => {
    const isExpanded = expandedSections.has(id)

    return (
      <div className="border border-iron-gray">
        <button
          onClick={() => toggleSection(id)}
          className="w-full p-4 sm:p-6 flex items-center justify-between hover:bg-iron-gray/10 transition-colors"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-iron-orange" />
            <h3 className="font-heading text-lg sm:text-xl text-iron-white uppercase">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
                className="p-2 hover:bg-iron-orange/20 rounded transition-colors"
                aria-label={`Edit ${title}`}
              >
                <Edit2 className="w-4 h-4 text-iron-orange" />
              </button>
            )}
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-iron-gray" />
            ) : (
              <ChevronDown className="w-5 h-5 text-iron-gray" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="p-4 sm:p-6 pt-0 border-t border-iron-gray/30">
            {children}
          </div>
        )}
      </div>
    )
  }

  // Helper component for data row
  const DataRow = ({ label, value }: { label: string; value: string | number | undefined | null }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-iron-gray">{label}</span>
      <span className="text-sm text-iron-white font-medium">{value || 'Not set'}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-iron-black text-iron-white pb-24">
      {/* Header */}
      <header className="border-b border-iron-gray sticky top-0 bg-iron-black z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="font-heading text-2xl sm:text-3xl text-iron-orange uppercase tracking-wider">
            Profile
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Basic Info Section (Always visible) */}
        <CollapsibleSection id="basic" title="Basic Information" icon={User}>
          <div className="space-y-2">
            <DataRow label="Name" value={profile.full_name} />
            <DataRow label="Email" value={profile.email} />
            <DataRow label="Member Since" value={profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'} />
            {profile.onboarding_completed && (
              <DataRow
                label="Onboarding Completed"
                value={profile.onboarding_completed_at ? new Date(profile.onboarding_completed_at).toLocaleDateString() : 'Yes'}
              />
            )}
          </div>
        </CollapsibleSection>

        {/* Physical Stats Section */}
        <CollapsibleSection
          id="physical"
          title="Physical Stats"
          icon={Scale}
          onEdit={() => setShowPhysicalModal(true)}
        >
          <div className="space-y-2">
            <DataRow label="Age" value={profile.age ? `${profile.age} years` : undefined} />
            <DataRow
              label="Sex"
              value={formatBiologicalSex(profile.biological_sex)}
            />
            <DataRow
              label="Height"
              value={profile.height_cm ? `${profile.height_cm} cm` : undefined}
            />
            <DataRow
              label="Current Weight"
              value={profile.current_weight_kg ? `${profile.current_weight_kg} kg` : undefined}
            />
            <DataRow
              label="Goal Weight"
              value={profile.goal_weight_kg ? `${profile.goal_weight_kg} kg` : undefined}
            />
          </div>
        </CollapsibleSection>

        {/* Goals & Training Section */}
        <CollapsibleSection
          id="goals"
          title="Goals & Training"
          icon={Target}
          onEdit={() => setShowGoalsModal(true)}
        >
          <div className="space-y-2">
            <DataRow label="Primary Goal" value={formatGoal(profile.primary_goal)} />
            <DataRow
              label="Experience Level"
              value={formatExperienceLevel(profile.experience_level)}
            />
            <DataRow label="Activity Level" value={formatActivityLevel(profile.activity_level)} />
            <DataRow
              label="Workout Frequency"
              value={profile.workout_frequency ? `${profile.workout_frequency}x per week` : undefined}
            />
          </div>
        </CollapsibleSection>

        {/* Nutrition Plan Section (Prominent Display) */}
        <CollapsibleSection id="macros" title="Nutrition Plan" icon={TrendingUp}>
          <div className="space-y-4">
            {/* Calorie Goal - Large Display */}
            <div className="text-center p-4 bg-iron-gray/20 border border-iron-orange/30 rounded">
              <div className="text-sm text-iron-gray mb-1 uppercase tracking-wider">Daily Calorie Goal</div>
              <div className="text-4xl font-heading text-iron-orange">
                {profile.daily_calorie_goal || '—'}
              </div>
              <div className="text-xs text-iron-gray mt-1">calories/day</div>
            </div>

            {/* Macros Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-iron-gray/10 border border-iron-gray/30">
                <div className="text-xs text-iron-gray uppercase mb-1">Protein</div>
                <div className="text-2xl font-heading text-iron-white">{profile.daily_protein_goal || '—'}</div>
                <div className="text-xs text-iron-gray">g</div>
              </div>
              <div className="text-center p-3 bg-iron-gray/10 border border-iron-gray/30">
                <div className="text-xs text-iron-gray uppercase mb-1">Carbs</div>
                <div className="text-2xl font-heading text-iron-white">{profile.daily_carbs_goal || '—'}</div>
                <div className="text-xs text-iron-gray">g</div>
              </div>
              <div className="text-center p-3 bg-iron-gray/10 border border-iron-gray/30">
                <div className="text-xs text-iron-gray uppercase mb-1">Fats</div>
                <div className="text-2xl font-heading text-iron-white">{profile.daily_fat_goal || '—'}</div>
                <div className="text-xs text-iron-gray">g</div>
              </div>
            </div>

            {/* TDEE */}
            <div className="space-y-2 pt-2 border-t border-iron-gray/30">
              <DataRow label="Estimated TDEE" value={profile.estimated_tdee ? `${profile.estimated_tdee} cal` : undefined} />
              <DataRow
                label="Macros Last Calculated"
                value={profile.macros_last_calculated_at ? new Date(profile.macros_last_calculated_at).toLocaleDateString() : undefined}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Dietary Preferences Section */}
        <CollapsibleSection
          id="dietary"
          title="Dietary Preferences"
          icon={Apple}
          onEdit={() => setShowDietaryModal(true)}
        >
          <div className="space-y-2">
            <DataRow
              label="Dietary Preference"
              value={formatDietaryPreference(profile.dietary_preference)}
            />
            <DataRow
              label="Food Allergies"
              value={profile.food_allergies && profile.food_allergies.length > 0 ? profile.food_allergies.join(', ') : 'None'}
            />
            <DataRow
              label="Foods to Avoid"
              value={profile.foods_to_avoid && profile.foods_to_avoid.length > 0 ? profile.foods_to_avoid.join(', ') : 'None'}
            />
            <DataRow label="Meals Per Day" value={profile.meals_per_day} />
            <DataRow label="Cooks Regularly" value={profile.cooks_regularly ? 'Yes' : 'No'} />
          </div>
        </CollapsibleSection>

        {/* Lifestyle Section */}
        <CollapsibleSection
          id="lifestyle"
          title="Lifestyle"
          icon={Moon}
          onEdit={() => setShowLifestyleModal(true)}
        >
          <div className="space-y-2">
            <DataRow label="Sleep Hours" value={profile.sleep_hours ? `${profile.sleep_hours} hours/night` : undefined} />
            <DataRow
              label="Stress Level"
              value={formatStressLevel(profile.stress_level)}
            />
          </div>
        </CollapsibleSection>

        {/* Consultation Section (if completed) */}
        {profile.consultation_completed && (
          <CollapsibleSection id="consultation" title="Consultation" icon={Heart}>
            <div className="space-y-2">
              <div className="p-4 bg-green-900/20 border border-green-700/50 rounded">
                <div className="flex items-center gap-2 text-green-500 mb-2">
                  <Heart className="w-4 h-4" />
                  <span className="font-medium">Consultation Completed</span>
                </div>
                <p className="text-sm text-iron-gray">
                  {profile.consultation_completed_at
                    ? `Completed on ${new Date(profile.consultation_completed_at).toLocaleDateString()}`
                    : 'You have completed a consultation'}
                </p>
              </div>
              {/* Additional consultation data can be displayed here when available */}
            </div>
          </CollapsibleSection>
        )}

        {/* Preferences Section */}
        <CollapsibleSection
          id="preferences"
          title="Preferences"
          icon={Settings}
          onEdit={() => setShowPreferencesModal(true)}
        >
          <div className="space-y-2">
            <DataRow
              label="Unit System"
              value={formatUnitSystem(profile.unit_system)}
            />
            <DataRow label="Timezone" value={profile.timezone} />
          </div>
        </CollapsibleSection>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full border-2 border-red-600 text-red-600 font-heading text-base sm:text-lg md:text-xl py-3 sm:py-4 uppercase tracking-wider hover:bg-red-600 hover:text-iron-white transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          Sign Out
        </button>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Modals */}
      {profile && (
        <>
          <EditPhysicalStatsModal
            profile={profile}
            isOpen={showPhysicalModal}
            onClose={() => setShowPhysicalModal(false)}
            onSuccess={handleUpdateSuccess}
            onError={handleUpdateError}
          />
          <EditGoalsModal
            profile={profile}
            isOpen={showGoalsModal}
            onClose={() => setShowGoalsModal(false)}
            onSuccess={handleUpdateSuccess}
            onError={handleUpdateError}
          />
          <EditDietaryModal
            profile={profile}
            isOpen={showDietaryModal}
            onClose={() => setShowDietaryModal(false)}
            onSuccess={handleUpdateSuccess}
            onError={handleUpdateError}
          />
          <EditLifestyleModal
            profile={profile}
            isOpen={showLifestyleModal}
            onClose={() => setShowLifestyleModal(false)}
            onSuccess={handleUpdateSuccess}
            onError={handleUpdateError}
          />
          <EditPreferencesModal
            profile={profile}
            isOpen={showPreferencesModal}
            onClose={() => setShowPreferencesModal(false)}
            onSuccess={handleUpdateSuccess}
            onError={handleUpdateError}
          />
        </>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
