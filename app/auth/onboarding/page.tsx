'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

interface OnboardingData {
  // Tier 1: Essential
  primary_goal: string;
  user_persona: string;
  current_activity_level: string;
  desired_training_frequency: number;
  biological_sex: string;
  age: number;
  current_weight_kg: number;
  height_cm: number;
  daily_meal_preference: number;
  city: string;
  location_permission: boolean;
  facility_access: string[];
  // Tier 2: Optimization
  training_time_preferences: string[];
  dietary_restrictions: string[];
  equipment_access: string[];
  injury_limitations: string[];
  experience_level: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const [data, setData] = useState<Partial<OnboardingData>>({
    training_time_preferences: [],
    dietary_restrictions: [],
    equipment_access: [],
    injury_limitations: [],
    facility_access: [],
    location_permission: false
  });

  const totalSteps = 14;

  const updateData = (field: keyof OnboardingData, value: any) => {
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

  const canProgress = () => {
    switch (step) {
      case 1: return !!data.primary_goal;
      case 2: return !!data.user_persona;
      case 3: return !!data.current_activity_level;
      case 4: return !!data.desired_training_frequency;
      case 5: return !!data.biological_sex;
      case 6: return !!data.age && data.age >= 18 && data.age <= 80;
      case 7: return !!data.current_weight_kg && data.current_weight_kg > 0;
      case 8: return !!data.height_cm && data.height_cm > 0;
      case 9: return !!data.daily_meal_preference;
      case 10: return true; // city optional but recommended
      case 11: return true; // facility access optional
      case 12: return true; // training time preferences optional
      case 13: return true; // dietary restrictions optional
      case 14: return !!data.experience_level;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

      const onboardingData = {
        user_id: user.id,
        ...data,
        completed: true
      };

      const { error: insertError } = await supabase
        .from('user_onboarding')
        .upsert(onboardingData, { onConflict: 'user_id' });

      if (insertError) throw insertError;

      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Failed to save onboarding');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">What's your primary goal?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  onClick={() => updateData('primary_goal', option.id)}
                  className={`p-4 border-2 transition-all ${
                    data.primary_goal === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Which best describes you?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'strength_athlete', label: 'Strength Athlete' },
                { id: 'bodybuilder', label: 'Bodybuilder' },
                { id: 'endurance_runner', label: 'Endurance Runner' },
                { id: 'triathlete', label: 'Triathlete' },
                { id: 'crossfit_athlete', label: 'CrossFit Athlete' },
                { id: 'team_sport_athlete', label: 'Team Sport Athlete' },
                { id: 'general_fitness', label: 'General Fitness' },
                { id: 'beginner_recovery', label: 'Beginner/Recovery' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => updateData('user_persona', option.id)}
                  className={`p-4 border-2 transition-all ${
                    data.user_persona === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Current activity level?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'sedentary', label: 'Sedentary', sub: '0-1 days/week' },
                { id: 'lightly_active', label: 'Lightly Active', sub: '2-3 days/week' },
                { id: 'moderately_active', label: 'Moderately Active', sub: '4-5 days/week' },
                { id: 'very_active', label: 'Very Active', sub: '6-7 days/week' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => updateData('current_activity_level', option.id)}
                  className={`p-4 border-2 transition-all ${
                    data.current_activity_level === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-iron-gray">{option.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Training days per week?</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[3, 4, 5, 6, 7].map(days => (
                <button
                  key={days}
                  onClick={() => updateData('desired_training_frequency', days)}
                  className={`p-6 border-2 transition-all ${
                    data.desired_training_frequency === days
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <div className="text-3xl font-heading text-iron-orange">{days}</div>
                  <div className="text-sm text-iron-gray mt-1">days</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Biological sex?</h2>
            <p className="text-sm text-iron-gray">Used for accurate calorie and macro calculations</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'male', label: 'Male' },
                { id: 'female', label: 'Female' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => updateData('biological_sex', option.id)}
                  className={`p-6 border-2 transition-all ${
                    data.biological_sex === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <span className="font-semibold text-lg">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">What's your age?</h2>
            <div className="max-w-sm mx-auto">
              <input
                type="number"
                min="18"
                max="80"
                value={data.age || ''}
                onChange={(e) => updateData('age', parseInt(e.target.value))}
                className="w-full p-4 bg-iron-black border-2 border-iron-gray text-white text-2xl text-center focus:border-iron-orange focus:outline-none"
                placeholder="Enter age"
              />
              <p className="text-sm text-iron-gray mt-2 text-center">Ages 18-80</p>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Current weight?</h2>
            <div className="max-w-sm mx-auto">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={data.current_weight_kg || ''}
                  onChange={(e) => updateData('current_weight_kg', parseFloat(e.target.value))}
                  className="flex-1 p-4 bg-iron-black border-2 border-iron-gray text-white text-2xl text-center focus:border-iron-orange focus:outline-none"
                  placeholder="70"
                />
                <div className="p-4 bg-iron-gray/20 border-2 border-iron-gray text-white text-2xl">kg</div>
              </div>
              <p className="text-sm text-iron-gray mt-2 text-center">Enter weight in kilograms</p>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Height?</h2>
            <div className="max-w-sm mx-auto">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={data.height_cm || ''}
                  onChange={(e) => updateData('height_cm', parseFloat(e.target.value))}
                  className="flex-1 p-4 bg-iron-black border-2 border-iron-gray text-white text-2xl text-center focus:border-iron-orange focus:outline-none"
                  placeholder="175"
                />
                <div className="p-4 bg-iron-gray/20 border-2 border-iron-gray text-white text-2xl">cm</div>
              </div>
              <p className="text-sm text-iron-gray mt-2 text-center">Enter height in centimeters</p>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Meals per day?</h2>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {[2, 3, 4, 5, 6].map(meals => (
                <button
                  key={meals}
                  onClick={() => updateData('daily_meal_preference', meals)}
                  className={`p-6 border-2 transition-all ${
                    data.daily_meal_preference === meals
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <div className="text-3xl font-heading text-iron-orange">{meals}</div>
                  <div className="text-sm text-iron-gray mt-1">meals</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Where do you live?</h2>
            <p className="text-iron-gray text-sm">For weather-aware programming (optional)</p>
            <div className="max-w-md mx-auto space-y-4">
              <input
                type="text"
                value={data.city || ''}
                onChange={(e) => updateData('city', e.target.value)}
                className="w-full p-4 bg-iron-black border-2 border-iron-gray text-white text-lg focus:border-iron-orange focus:outline-none"
                placeholder="Enter your city"
              />
              <label className="flex items-center gap-3 p-4 border-2 border-iron-gray cursor-pointer hover:border-iron-orange/50 transition-all">
                <input
                  type="checkbox"
                  checked={data.location_permission || false}
                  onChange={(e) => updateData('location_permission', e.target.checked)}
                  className="w-5 h-5 accent-iron-orange"
                />
                <div>
                  <div className="font-semibold">Allow location access</div>
                  <div className="text-sm text-iron-gray">AI can adapt workouts based on weather (rain, snow, heat)</div>
                </div>
              </label>
            </div>
          </div>
        );

      case 11:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Available facilities?</h2>
            <p className="text-iron-gray text-sm">Select all facilities you have access to (optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'gym', label: 'Gym', icon: '🏋️' },
                { id: 'tennis_courts', label: 'Tennis Courts', icon: '🎾' },
                { id: 'soccer_field', label: 'Soccer Field', icon: '⚽' },
                { id: 'basketball_court', label: 'Basketball Court', icon: '🏀' },
                { id: 'swimming_pool', label: 'Swimming Pool', icon: '🏊' },
                { id: 'track_indoor', label: 'Indoor Track', icon: '🏃' },
                { id: 'track_outdoor', label: 'Outdoor Track', icon: '🏃' },
                { id: 'climbing_gym', label: 'Climbing Gym', icon: '🧗' },
                { id: 'yoga_studio', label: 'Yoga Studio', icon: '🧘' },
                { id: 'home_gym', label: 'Home Gym', icon: '🏠' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => toggleArray('facility_access', option.id)}
                  className={`p-4 border-2 transition-all text-left ${
                    data.facility_access?.includes(option.id)
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{option.icon}</span>
                    <span className="font-semibold">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 12:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">When do you train?</h2>
            <p className="text-iron-gray text-sm">Select all that apply (optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'early_morning', label: 'Early Morning', sub: '5-8 AM' },
                { id: 'morning', label: 'Morning', sub: '8-11 AM' },
                { id: 'midday', label: 'Midday', sub: '11 AM-2 PM' },
                { id: 'afternoon', label: 'Afternoon', sub: '2-5 PM' },
                { id: 'evening', label: 'Evening', sub: '5-8 PM' },
                { id: 'night', label: 'Night', sub: '8-10 PM' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => toggleArray('training_time_preferences', option.id)}
                  className={`p-4 border-2 transition-all ${
                    data.training_time_preferences?.includes(option.id)
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-iron-gray">{option.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 13:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Dietary restrictions?</h2>
            <p className="text-iron-gray text-sm">Select all that apply (optional)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                'none', 'vegetarian', 'vegan', 'dairy_free', 'gluten_free', 'nut_allergies', 'shellfish_allergies'
              ].map(option => (
                <button
                  key={option}
                  onClick={() => {
                    if (option === 'none') {
                      updateData('dietary_restrictions', ['none']);
                    } else {
                      const filtered = data.dietary_restrictions?.filter(r => r !== 'none') || [];
                      toggleArray('dietary_restrictions', option);
                    }
                  }}
                  className={`p-4 border-2 transition-all ${
                    data.dietary_restrictions?.includes(option)
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <span className="font-semibold capitalize">{option.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 14:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Training experience?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'beginner', label: 'Beginner', sub: '0-1 year' },
                { id: 'intermediate', label: 'Intermediate', sub: '1-3 years' },
                { id: 'advanced', label: 'Advanced', sub: '3-5 years' },
                { id: 'expert', label: 'Expert', sub: '5+ years' }
              ].map(option => (
                <button
                  key={option.id}
                  onClick={() => updateData('experience_level', option.id)}
                  className={`p-4 border-2 transition-all ${
                    data.experience_level === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-semibold">{option.label}</div>
                    <div className="text-sm text-iron-gray">{option.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center px-4 py-8">
      <div className="max-w-3xl w-full space-y-8">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-iron-gray">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-iron-gray/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-iron-orange transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Current Step */}
        <div className="min-h-[400px]">
          {renderStep()}
        </div>

        {error && (
          <div className="text-center text-iron-orange p-4 border border-iron-orange">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-6 py-3 border-2 border-iron-gray hover:border-iron-orange transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProgress()}
              className="px-6 py-3 bg-iron-orange text-iron-black hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-heading uppercase"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProgress() || loading}
              className="px-8 py-3 bg-iron-orange text-iron-black hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-heading uppercase text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Complete Setup'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}