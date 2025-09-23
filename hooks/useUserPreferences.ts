'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UnitSystem } from '@/lib/utils/units';

export interface UserPreferences {
  unit_system: UnitSystem;
  default_activity_view: 'list' | 'grid' | 'calendar';
  activities_per_page: number;
  activities_public: boolean;
  share_stats: boolean;
  workout_reminders: boolean;
  achievement_notifications: boolean;
  weekly_summary: boolean;
  auto_pause: boolean;
  countdown_seconds: number;
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get or create preferences
      const { data, error } = await supabase
        .rpc('get_or_create_user_preferences', { p_user_id: user.id });

      if (error) throw error;

      setPreferences(data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setPreferences(data);
      return data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  };

  const toggleUnitSystem = async () => {
    if (!preferences) return;

    const newSystem = preferences.unit_system === 'metric' ? 'imperial' : 'metric';
    return updatePreferences({ unit_system: newSystem });
  };

  return {
    preferences,
    loading,
    updatePreferences,
    toggleUnitSystem,
    reload: loadPreferences
  };
}