'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ArrowLeft, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import BottomNavigation from '@/app/components/BottomNavigation';

interface OnboardingData {
  primary_goal: string;
  user_persona: string;
  current_activity_level: string;
  desired_training_frequency: number;
  program_duration_weeks: number;
  biological_sex: string;
  age: number;
  current_weight_kg: number;
  height_cm: number;
  daily_meal_preference: number;
  training_time_preferences: string[];
  dietary_restrictions: string[];
  equipment_access: string[];
  injury_limitations: string[];
  experience_level: string;
}

export default function PreferencesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({
    training_time_preferences: [],
    dietary_restrictions: [],
    equipment_access: [],
    injury_limitations: []
  });

  useEffect(() => {
    loadOnboardingData();
  }, []);

  const loadOnboardingData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { data: onboarding, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (onboarding) {
        setData(onboarding);
      }
    } catch (err) {
      console.error('Load error:', err);
      setError('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const { error: updateError } = await supabase
        .from('user_onboarding')
        .update(data)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Trigger vectorization update
      await fetch('/api/vectorize-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof OnboardingData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: keyof OnboardingData, value: string) => {
    setData(prev => {
      const current = (prev[field] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-iron-orange" />
          <p className="text-iron-gray">Loading preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/profile')}
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-heading text-2xl text-iron-orange uppercase tracking-wider flex items-center gap-2">
              <Settings className="w-6 h-6" />
              Program Preferences
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Goal */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-4 uppercase">Primary Goal</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'build_muscle', label: 'Build Muscle' },
                { id: 'lose_fat', label: 'Lose Fat' },
                { id: 'improve_endurance', label: 'Improve Endurance' },
                { id: 'increase_strength', label: 'Increase Strength' },
                { id: 'sport_performance', label: 'Sport Performance' },
                { id: 'general_health', label: 'General Health' },
                { id: 'rehab_recovery', label: 'Rehab/Recovery' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateField('primary_goal', option.id)}
                  className={`p-3 border-2 transition-all text-sm ${
                    data.primary_goal === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Persona */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-4 uppercase">Training Style</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { id: 'strength_athlete', label: 'Strength Athlete' },
                { id: 'bodybuilder', label: 'Bodybuilder' },
                { id: 'endurance_runner', label: 'Endurance Runner' },
                { id: 'triathlete', label: 'Triathlete' },
                { id: 'crossfit_athlete', label: 'CrossFit' },
                { id: 'team_sport_athlete', label: 'Team Sport' },
                { id: 'general_fitness', label: 'General Fitness' },
                { id: 'beginner_recovery', label: 'Beginner' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateField('user_persona', option.id)}
                  className={`p-3 border-2 transition-all text-sm ${
                    data.user_persona === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Training Frequency & Duration */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-4 uppercase">Training Schedule</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-iron-gray text-sm mb-2 uppercase">Days Per Week</label>
                <div className="grid grid-cols-5 gap-2">
                  {[3, 4, 5, 6, 7].map(days => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => updateField('desired_training_frequency', days)}
                      className={`p-4 border-2 transition-all ${
                        data.desired_training_frequency === days
                          ? 'border-iron-orange bg-iron-orange/10'
                          : 'border-iron-gray hover:border-iron-orange/50'
                      }`}
                    >
                      <div className="text-2xl font-heading text-iron-orange">{days}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-iron-gray text-sm mb-2 uppercase">Program Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { weeks: 4, label: '1 Month' },
                    { weeks: 8, label: '2 Months' },
                    { weeks: 12, label: '3 Months' },
                    { weeks: 16, label: '4 Months' }
                  ].map(option => (
                    <button
                      key={option.weeks}
                      type="button"
                      onClick={() => updateField('program_duration_weeks', option.weeks)}
                      className={`p-4 border-2 transition-all ${
                        data.program_duration_weeks === option.weeks
                          ? 'border-iron-orange bg-iron-orange/10'
                          : 'border-iron-gray hover:border-iron-orange/50'
                      }`}
                    >
                      <div className="text-lg font-heading text-iron-orange">{option.label}</div>
                      <div className="text-xs text-iron-gray">{option.weeks} weeks</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Body Stats */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-4 uppercase">Body Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-iron-gray text-sm mb-2 uppercase">Age</label>
                <input
                  type="number"
                  min="18"
                  max="80"
                  value={data.age || ''}
                  onChange={(e) => updateField('age', parseInt(e.target.value))}
                  className="w-full bg-iron-black border-2 border-iron-gray text-white px-4 py-3 focus:border-iron-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-iron-gray text-sm mb-2 uppercase">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.current_weight_kg || ''}
                  onChange={(e) => updateField('current_weight_kg', parseFloat(e.target.value))}
                  className="w-full bg-iron-black border-2 border-iron-gray text-white px-4 py-3 focus:border-iron-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-iron-gray text-sm mb-2 uppercase">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.height_cm || ''}
                  onChange={(e) => updateField('height_cm', parseFloat(e.target.value))}
                  className="w-full bg-iron-black border-2 border-iron-gray text-white px-4 py-3 focus:border-iron-orange focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Meals Per Day */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-4 uppercase">Nutrition</h2>
            <div>
              <label className="block text-iron-gray text-sm mb-2 uppercase">Meals Per Day</label>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map(meals => (
                  <button
                    key={meals}
                    type="button"
                    onClick={() => updateField('daily_meal_preference', meals)}
                    className={`p-4 border-2 transition-all ${
                      data.daily_meal_preference === meals
                        ? 'border-iron-orange bg-iron-orange/10'
                        : 'border-iron-gray hover:border-iron-orange/50'
                    }`}
                  >
                    <div className="text-2xl font-heading text-iron-orange">{meals}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-iron-gray text-sm mb-2 uppercase">Dietary Restrictions</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['none', 'vegetarian', 'vegan', 'dairy_free', 'gluten_free', 'nut_allergies', 'shellfish_allergies'].map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      if (option === 'none') {
                        updateField('dietary_restrictions', ['none']);
                      } else {
                        toggleArray('dietary_restrictions', option);
                      }
                    }}
                    className={`p-3 border-2 transition-all text-sm ${
                      data.dietary_restrictions?.includes(option)
                        ? 'border-iron-orange bg-iron-orange/10'
                        : 'border-iron-gray hover:border-iron-orange/50'
                    }`}
                  >
                    {option.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Equipment */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-4 uppercase">Equipment Access</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'full_gym', label: 'Full Gym' },
                { id: 'home_gym', label: 'Home Gym' },
                { id: 'dumbbells', label: 'Dumbbells' },
                { id: 'resistance_bands', label: 'Bands' },
                { id: 'bodyweight', label: 'Bodyweight' },
                { id: 'cardio_equipment', label: 'Cardio' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleArray('equipment_access', option.id)}
                  className={`p-3 border-2 transition-all text-sm ${
                    data.equipment_access?.includes(option.id)
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="border-2 border-green-600 bg-green-600/10 p-4">
              <p className="text-green-500">Preferences updated successfully!</p>
            </div>
          )}

          {error && (
            <div className="border-2 border-red-600 bg-red-600/10 p-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              disabled={isSaving}
              className="flex-1 border-2 border-iron-gray text-iron-white font-heading py-4 uppercase tracking-wider hover:bg-iron-gray/20 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-iron-orange text-iron-black font-heading py-4 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </form>
      </main>

      <BottomNavigation />
    </div>
  );
}
