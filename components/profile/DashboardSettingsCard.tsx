/**
 * Dashboard Settings Card
 *
 * Allows users to customize their dashboard experience:
 * - Choose persona (simple/balanced/detailed)
 * - Toggle card visibility (weight, recovery, workout)
 * - Preview changes before applying
 * - Reset to auto-detect defaults
 */

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { updateDashboardPreference } from '@/lib/api/dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { LayoutDashboard, Eye, EyeOff, RefreshCw, Check, Info } from 'lucide-react'
import type { DashboardVariant } from '@/lib/types/dashboard'

interface DashboardSettings {
  preference: DashboardVariant
  showsWeightCard: boolean
  showsRecoveryCard: boolean
  showsWorkoutCard: boolean
}

export function DashboardSettingsCard() {
  const supabase = createClient()
  const { toast } = useToast()

  const [settings, setSettings] = useState<DashboardSettings>({
    preference: 'balanced',
    showsWeightCard: false,
    showsRecoveryCard: false,
    showsWorkoutCard: true,
  })

  const [originalSettings, setOriginalSettings] = useState<DashboardSettings>(settings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    // Check if settings have changed from original
    const changed =
      settings.preference !== originalSettings.preference ||
      settings.showsWeightCard !== originalSettings.showsWeightCard ||
      settings.showsRecoveryCard !== originalSettings.showsRecoveryCard ||
      settings.showsWorkoutCard !== originalSettings.showsWorkoutCard

    setHasChanges(changed)
  }, [settings, originalSettings])

  async function loadSettings() {
    try {
      setIsLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('dashboard_preference, shows_weight_card, shows_recovery_card, shows_workout_card')
        .eq('id', user.id)
        .single()

      if (error) throw error

      const loadedSettings: DashboardSettings = {
        preference: (profile?.dashboard_preference as DashboardVariant) || 'balanced',
        showsWeightCard: profile?.shows_weight_card ?? false,
        showsRecoveryCard: profile?.shows_recovery_card ?? false,
        showsWorkoutCard: profile?.shows_workout_card ?? true,
      }

      setSettings(loadedSettings)
      setOriginalSettings(loadedSettings)
    } catch (error) {
      console.error('Failed to load dashboard settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard settings',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function saveSettings() {
    try {
      setIsSaving(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Update preference via API
      await updateDashboardPreference(settings.preference)

      // Update card visibility flags via Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          shows_weight_card: settings.showsWeightCard,
          shows_recovery_card: settings.showsRecoveryCard,
          shows_workout_card: settings.showsWorkoutCard,
        })
        .eq('id', user.id)

      if (error) throw error

      setOriginalSettings(settings)

      toast({
        title: 'Settings saved!',
        description: 'Your dashboard has been updated. Refresh to see changes.',
      })
    } catch (error) {
      console.error('Failed to save dashboard settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to save dashboard settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function resetToAutoDetect() {
    try {
      setIsSaving(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Not authenticated')
      }

      // Reset to defaults
      await updateDashboardPreference('balanced')

      const { error } = await supabase
        .from('profiles')
        .update({
          shows_weight_card: false, // Auto-detect will take over
          shows_recovery_card: false, // Auto-detect will take over
          shows_workout_card: true, // Default
        })
        .eq('id', user.id)

      if (error) throw error

      const resetSettings: DashboardSettings = {
        preference: 'balanced',
        showsWeightCard: false,
        showsRecoveryCard: false,
        showsWorkoutCard: true,
      }

      setSettings(resetSettings)
      setOriginalSettings(resetSettings)

      toast({
        title: 'Settings reset!',
        description: 'Dashboard will auto-detect based on your usage patterns.',
      })
    } catch (error) {
      console.error('Failed to reset dashboard settings:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset dashboard settings',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  function handlePreferenceChange(value: string) {
    setSettings({ ...settings, preference: value as DashboardVariant })
  }

  function handleToggle(field: keyof DashboardSettings, value: boolean) {
    setSettings({ ...settings, [field]: value })
  }

  if (isLoading) {
    return (
      <Card className="bg-iron-gray border-iron-gray">
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-iron-orange" />
            <span className="ml-2 text-gray-400">Loading settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-iron-gray border-iron-gray">
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-iron-orange" aria-hidden="true" />
          <CardTitle className="text-white text-xl">Dashboard Settings</CardTitle>
        </div>
        <CardDescription className="text-gray-400">
          Customize how your dashboard looks and which cards appear
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Dashboard Style Selector */}
        <div className="space-y-3">
          <Label className="text-white font-semibold text-base">Dashboard Style</Label>
          <RadioGroup value={settings.preference} onValueChange={handlePreferenceChange}>
            {/* Simple */}
            <div className="flex items-start space-x-3 p-4 border border-iron-gray rounded-lg hover:border-iron-orange transition-colors">
              <RadioGroupItem value="simple" id="simple" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="simple" className="text-white font-medium cursor-pointer">
                  Simple
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Minimalist view with just your next action. Perfect for "just tell me what to do" users.
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Next Action</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Quick Actions</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Nutrition</span>
                </div>
              </div>
            </div>

            {/* Balanced */}
            <div className="flex items-start space-x-3 p-4 border border-iron-gray rounded-lg hover:border-iron-orange transition-colors">
              <RadioGroupItem value="balanced" id="balanced" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="balanced" className="text-white font-medium cursor-pointer">
                  Balanced <span className="text-xs text-iron-orange">(Recommended)</span>
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Overview with key metrics. Most popular choice for tracking progress without overwhelm.
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Today's Plan</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Nutrition</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Weight</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Weekly Trends</span>
                </div>
              </div>
            </div>

            {/* Detailed */}
            <div className="flex items-start space-x-3 p-4 border border-iron-gray rounded-lg hover:border-iron-orange transition-colors">
              <RadioGroupItem value="detailed" id="detailed" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="detailed" className="text-white font-medium cursor-pointer">
                  Detailed
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Full analytics dashboard with charts, trends, and complete breakdown. For data enthusiasts.
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Today's Plan</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Nutrition</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Weight</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Activities</span>
                  <span className="px-2 py-0.5 bg-iron-black text-xs text-gray-400 rounded">Analytics</span>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Card Visibility Toggles */}
        <div className="space-y-3">
          <Label className="text-white font-semibold text-base">Card Visibility</Label>
          <p className="text-sm text-gray-400 mb-3">
            Choose which optional cards appear on your dashboard
          </p>

          {/* Weight Tracking Card */}
          <div className="flex items-center justify-between p-4 border border-iron-gray rounded-lg">
            <div className="flex items-start gap-3">
              {settings.showsWeightCard ? (
                <Eye className="w-5 h-5 text-iron-orange mt-0.5" aria-hidden="true" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-500 mt-0.5" aria-hidden="true" />
              )}
              <div>
                <Label htmlFor="weight-card" className="text-white font-medium cursor-pointer">
                  Weight Tracking Card
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Shows weight progress, sparkline graph, and goal tracking
                </p>
              </div>
            </div>
            <Switch
              id="weight-card"
              checked={settings.showsWeightCard}
              onCheckedChange={(checked) => handleToggle('showsWeightCard', checked)}
            />
          </div>

          {/* Recovery Metrics Card */}
          <div className="flex items-center justify-between p-4 border border-iron-gray rounded-lg">
            <div className="flex items-start gap-3">
              {settings.showsRecoveryCard ? (
                <Eye className="w-5 h-5 text-iron-orange mt-0.5" aria-hidden="true" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-500 mt-0.5" aria-hidden="true" />
              )}
              <div>
                <Label htmlFor="recovery-card" className="text-white font-medium cursor-pointer">
                  Recovery Metrics Card
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Shows sleep hours, soreness level, and readiness score
                </p>
              </div>
            </div>
            <Switch
              id="recovery-card"
              checked={settings.showsRecoveryCard}
              onCheckedChange={(checked) => handleToggle('showsRecoveryCard', checked)}
            />
          </div>

          {/* Workout Card */}
          <div className="flex items-center justify-between p-4 border border-iron-gray rounded-lg">
            <div className="flex items-start gap-3">
              {settings.showsWorkoutCard ? (
                <Eye className="w-5 h-5 text-iron-orange mt-0.5" aria-hidden="true" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-500 mt-0.5" aria-hidden="true" />
              )}
              <div>
                <Label htmlFor="workout-card" className="text-white font-medium cursor-pointer">
                  Workout Card
                </Label>
                <p className="text-sm text-gray-400 mt-1">
                  Shows today's workout plan and completed activities
                </p>
              </div>
            </div>
            <Switch
              id="workout-card"
              checked={settings.showsWorkoutCard}
              onCheckedChange={(checked) => handleToggle('showsWorkoutCard', checked)}
            />
          </div>
        </div>

        {/* Auto-Detect Info */}
        <div className="bg-iron-black p-4 rounded-lg border border-iron-gray">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="text-sm text-gray-400">
              <p className="font-medium text-white mb-1">Smart Auto-Detection</p>
              <p>
                Some cards auto-show based on your usage. For example, the Weight Tracking card
                appears if you log 2+ weights in 14 days, even if toggled off here.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={saveSettings}
            disabled={!hasChanges || isSaving}
            className="flex-1 bg-iron-orange hover:bg-orange-600 text-white font-semibold"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>

          <Button
            onClick={resetToAutoDetect}
            disabled={isSaving}
            variant="outline"
            className="border-iron-gray bg-iron-black hover:bg-iron-gray text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Auto-Detect
          </Button>
        </div>

        {hasChanges && (
          <p className="text-sm text-iron-orange text-center">
            You have unsaved changes. Click "Save Changes" to apply.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
