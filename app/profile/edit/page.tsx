'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ArrowLeft, User } from 'lucide-react';
import { Profile, ExperienceLevel } from '@/types/profile';

const focusAreaOptions = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'endurance', label: 'Endurance' },
  { value: 'strength', label: 'Strength Training' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'mental_health', label: 'Mental Health' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'sports_performance', label: 'Sports Performance' },
  { value: 'rehabilitation', label: 'Rehabilitation' },
  { value: 'general_fitness', label: 'General Fitness' },
];

export default function EditProfilePage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profile, setProfile] = useState<Partial<Profile>>({
    full_name: '',
    age: undefined,
    location: '',
    about_me: '',
    fitness_goals: '',
    experience_level: 'beginner' as ExperienceLevel,
    weekly_hours: 3,
    primary_goal: '',
    focus_areas: [],
    health_conditions: '',
    dietary_preferences: '',
    equipment_access: '',
    preferred_workout_time: '',
    strengths: '',
    areas_for_improvement: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/profile');

      if (!response.ok) {
        throw new Error('Failed to load profile');
      }

      const data = await response.json();
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Profile load error:', error);
      setError('Failed to load profile data');
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

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/profile');
      }, 1000);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      focus_areas: checked
        ? [...(prev.focus_areas || []), area]
        : (prev.focus_areas || []).filter(a => a !== area)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-iron-orange" />
          <p className="text-iron-gray">Loading profile...</p>
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
              <User className="w-6 h-6" />
              Edit Profile
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-6 uppercase">Basic Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full_name" className="block text-iron-gray text-sm mb-2 uppercase">
                    Full Name
                  </label>
                  <input
                    id="full_name"
                    type="text"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="age" className="block text-iron-gray text-sm mb-2 uppercase">
                    Age
                  </label>
                  <input
                    id="age"
                    type="number"
                    min="13"
                    max="120"
                    value={profile.age || ''}
                    onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || undefined })}
                    placeholder="Enter your age"
                    className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="location" className="block text-iron-gray text-sm mb-2 uppercase">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, Country"
                  className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors"
                />
              </div>

              <div>
                <label htmlFor="about_me" className="block text-iron-gray text-sm mb-2 uppercase">
                  About Me
                </label>
                <textarea
                  id="about_me"
                  value={profile.about_me || ''}
                  onChange={(e) => setProfile({ ...profile, about_me: e.target.value })}
                  placeholder="Tell us a bit about yourself..."
                  rows={3}
                  className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Fitness Goals & Experience */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-6 uppercase">Fitness Profile</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="experience_level" className="block text-iron-gray text-sm mb-2 uppercase">
                    Experience Level
                  </label>
                  <select
                    id="experience_level"
                    value={profile.experience_level || 'beginner'}
                    onChange={(e) => setProfile({ ...profile, experience_level: e.target.value as ExperienceLevel })}
                    className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="expert">Expert</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="weekly_hours" className="block text-iron-gray text-sm mb-2 uppercase">
                    Weekly Training Hours
                  </label>
                  <input
                    id="weekly_hours"
                    type="number"
                    min="0"
                    max="40"
                    step="0.5"
                    value={profile.weekly_hours || ''}
                    onChange={(e) => setProfile({ ...profile, weekly_hours: parseFloat(e.target.value) || 0 })}
                    placeholder="Hours per week"
                    className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="primary_goal" className="block text-iron-gray text-sm mb-2 uppercase">
                  Primary Goal
                </label>
                <textarea
                  id="primary_goal"
                  value={profile.primary_goal || ''}
                  onChange={(e) => setProfile({ ...profile, primary_goal: e.target.value })}
                  placeholder="What's your main fitness goal? Be specific..."
                  rows={2}
                  className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors resize-none"
                />
              </div>

              <div>
                <label htmlFor="preferred_workout_time" className="block text-iron-gray text-sm mb-2 uppercase">
                  Preferred Workout Time
                </label>
                <select
                  id="preferred_workout_time"
                  value={profile.preferred_workout_time || ''}
                  onChange={(e) => setProfile({ ...profile, preferred_workout_time: e.target.value })}
                  className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors"
                >
                  <option value="">Select time</option>
                  <option value="early_morning">Early Morning (5-7 AM)</option>
                  <option value="morning">Morning (7-10 AM)</option>
                  <option value="midday">Midday (10 AM-2 PM)</option>
                  <option value="afternoon">Afternoon (2-5 PM)</option>
                  <option value="evening">Evening (5-8 PM)</option>
                  <option value="night">Night (8-11 PM)</option>
                </select>
              </div>

              <div>
                <label className="block text-iron-gray text-sm mb-3 uppercase">
                  Focus Areas
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {focusAreaOptions.map((area) => (
                    <label
                      key={area.value}
                      className="flex items-center gap-2 cursor-pointer p-3 border border-iron-gray hover:border-iron-orange transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={(profile.focus_areas || []).includes(area.value)}
                        onChange={(e) => handleFocusAreaChange(area.value, e.target.checked)}
                        className="w-4 h-4 bg-iron-black border-2 border-iron-gray focus:ring-0 focus:ring-offset-0 text-iron-orange"
                      />
                      <span className="text-sm text-iron-white">{area.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Preferences */}
          <div className="border border-iron-gray p-6">
            <h2 className="font-heading text-xl text-iron-white mb-6 uppercase">Additional Info</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="equipment_access" className="block text-iron-gray text-sm mb-2 uppercase">
                  Equipment Access
                </label>
                <textarea
                  id="equipment_access"
                  value={profile.equipment_access || ''}
                  onChange={(e) => setProfile({ ...profile, equipment_access: e.target.value })}
                  placeholder="What equipment do you have access to? (gym, home equipment, etc.)"
                  rows={2}
                  className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors resize-none"
                />
              </div>

              <div>
                <label htmlFor="dietary_preferences" className="block text-iron-gray text-sm mb-2 uppercase">
                  Dietary Preferences
                </label>
                <textarea
                  id="dietary_preferences"
                  value={profile.dietary_preferences || ''}
                  onChange={(e) => setProfile({ ...profile, dietary_preferences: e.target.value })}
                  placeholder="Any dietary restrictions or preferences? (vegan, keto, allergies, etc.)"
                  rows={2}
                  className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors resize-none"
                />
              </div>

              <div>
                <label htmlFor="health_conditions" className="block text-iron-gray text-sm mb-2 uppercase">
                  Health Conditions
                </label>
                <textarea
                  id="health_conditions"
                  value={profile.health_conditions || ''}
                  onChange={(e) => setProfile({ ...profile, health_conditions: e.target.value })}
                  placeholder="Any injuries or health conditions we should know about?"
                  rows={2}
                  className="w-full bg-iron-black border-2 border-iron-gray text-iron-white px-4 py-3 focus:outline-none focus:border-iron-orange transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="border-2 border-green-600 bg-green-600/10 p-4">
              <p className="text-green-500">Profile updated successfully! Redirecting...</p>
            </div>
          )}

          {/* Error Message */}
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
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
