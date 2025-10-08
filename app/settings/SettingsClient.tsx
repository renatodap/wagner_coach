'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  User,
  Target,
  LogOut,
  Check,
  Dumbbell,
  TrendingDown,
  Settings as SettingsIcon
} from 'lucide-react';
import StravaConnection from '@/components/StravaConnection';
import GarminConnection from '@/components/GarminConnection';
import BottomNavigation from '@/app/components/BottomNavigation';
import { getAutoLogPreference, updateAutoLogPreference } from '@/lib/api/profile';

type Goal = 'build_muscle' | 'lose_weight' | 'gain_strength';

interface Profile {
  full_name?: string;
  goal?: Goal;
}

interface SettingsClientProps {
  profile: Profile | null;
  userEmail?: string;
}

export default function SettingsClient({ profile, userEmail }: SettingsClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [selectedGoal, setSelectedGoal] = useState<Goal>(profile?.goal || 'build_muscle');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [autoLogEnabled, setAutoLogEnabled] = useState(false);
  const [loadingAutoLog, setLoadingAutoLog] = useState(true);

  const goals = [
    {
      id: 'build_muscle' as Goal,
      title: 'BUILD MUSCLE',
      description: 'Pack on lean mass with hypertrophy-focused training',
      icon: <Dumbbell className="w-6 h-6" />,
    },
    {
      id: 'lose_weight' as Goal,
      title: 'LOSE WEIGHT',
      description: 'Burn fat with high-intensity circuits and cardio',
      icon: <TrendingDown className="w-6 h-6" />,
    },
    {
      id: 'gain_strength' as Goal,
      title: 'GAIN STRENGTH',
      description: 'Build raw power with heavy compound movements',
      icon: <Target className="w-6 h-6" />,
    },
  ];

  // Load auto-log preference on mount
  useEffect(() => {
    const loadPreference = async () => {
      try {
        const pref = await getAutoLogPreference();
        setAutoLogEnabled(pref.auto_log_enabled);
      } catch (err) {
        console.error('Failed to load auto-log preference:', err);
      } finally {
        setLoadingAutoLog(false);
      }
    };
    loadPreference();
  }, []);

  const handleToggleAutoLog = async () => {
    const newValue = !autoLogEnabled;
    try {
      setAutoLogEnabled(newValue);
      await updateAutoLogPreference(newValue);
    } catch (err) {
      setAutoLogEnabled(!newValue);
      setError('Failed to update auto-log preference');
      console.error(err);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update({
          full_name: fullName,
          goal: selectedGoal,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // If goal changed, regenerate workouts for next week
      if (selectedGoal !== profile?.goal) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: workoutError } = await (supabase as any)
          .rpc('generate_week_workouts', {
            p_user_id: user.id,
            p_goal: selectedGoal,
          });

        if (workoutError) console.error('Failed to regenerate workouts:', workoutError);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError((err as Error).message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/workouts"
              className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <h1 className="font-heading text-2xl text-iron-orange uppercase tracking-wider">
              Settings
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Profile Section */}
        <div className="border border-iron-gray p-6">
          <h2 className="font-heading text-2xl text-iron-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-iron-orange" />
            PROFILE
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-iron-gray text-xs uppercase mb-2">
                Email
              </label>
              <input
                type="email"
                value={userEmail || ''}
                disabled
                className="w-full bg-iron-gray/20 border border-iron-gray/50 px-4 py-3 text-iron-gray cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-iron-gray text-xs uppercase mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Goal Selection */}
        <div className="border border-iron-gray p-6">
          <h2 className="font-heading text-2xl text-iron-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-iron-orange" />
            FITNESS GOAL
          </h2>

          <div className="grid gap-4">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => setSelectedGoal(goal.id)}
                className={`p-4 border-2 transition-all text-left ${
                  selectedGoal === goal.id
                    ? 'border-iron-orange bg-iron-orange/10'
                    : 'border-iron-gray hover:border-iron-orange/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={selectedGoal === goal.id ? 'text-iron-orange' : 'text-iron-gray'}>
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-lg text-iron-white">
                      {goal.title}
                    </h3>
                    <p className="text-iron-gray text-sm mt-1">
                      {goal.description}
                    </p>
                  </div>
                  {selectedGoal === goal.id && (
                    <Check className="w-5 h-5 text-iron-orange" />
                  )}
                </div>
              </button>
            ))}
          </div>

          <p className="text-iron-gray text-sm mt-4">
            Changing your goal will generate new workouts starting next week
          </p>
        </div>

        {/* Coach Behavior - Auto-Log Preference */}
        <div className="border border-iron-gray p-6">
          <h2 className="font-heading text-2xl text-iron-white mb-6 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-iron-orange" />
            COACH BEHAVIOR
          </h2>

          <div className="space-y-4">
            <h3 className="font-heading text-lg text-iron-white mb-3">
              Logging Mode
            </h3>

            {/* Preview Mode Option */}
            <button
              onClick={() => !autoLogEnabled || handleToggleAutoLog()}
              disabled={loadingAutoLog}
              className={`w-full p-4 border-2 transition-all text-left ${
                !autoLogEnabled
                  ? 'border-iron-orange bg-iron-orange/10'
                  : 'border-iron-gray hover:border-iron-orange/50'
              } disabled:opacity-50`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">👁️</div>
                <div className="flex-1">
                  <h4 className="font-heading text-lg text-iron-white flex items-center gap-2">
                    PREVIEW MODE
                    {!autoLogEnabled && <Check className="w-5 h-5 text-iron-orange" />}
                  </h4>
                  <p className="text-iron-gray text-sm mt-1">
                    Review and edit logs before saving them to your history. Perfect for careful tracking.
                  </p>
                  <div className="mt-2 text-xs text-iron-gray bg-iron-black/50 p-2 border-l-2 border-iron-orange">
                    <strong>How it works:</strong> When Coach detects you logged something (meal, workout, etc.),
                    you'll see a preview card. Review the details, make edits if needed, then confirm to save.
                  </div>
                </div>
              </div>
            </button>

            {/* Auto-Save Mode Option */}
            <button
              onClick={() => autoLogEnabled || handleToggleAutoLog()}
              disabled={loadingAutoLog}
              className={`w-full p-4 border-2 transition-all text-left ${
                autoLogEnabled
                  ? 'border-iron-orange bg-iron-orange/10'
                  : 'border-iron-gray hover:border-iron-orange/50'
              } disabled:opacity-50`}
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">⚡</div>
                <div className="flex-1">
                  <h4 className="font-heading text-lg text-iron-white flex items-center gap-2">
                    AUTO-SAVE MODE
                    {autoLogEnabled && <Check className="w-5 h-5 text-iron-orange" />}
                  </h4>
                  <p className="text-iron-gray text-sm mt-1">
                    Logs saved automatically and instantly. Edit them later if needed. Perfect for speed.
                  </p>
                  <div className="mt-2 text-xs text-iron-gray bg-iron-black/50 p-2 border-l-2 border-iron-orange">
                    <strong>How it works:</strong> When Coach detects you logged something, it saves immediately
                    to your history. You can view and edit logs anytime from your nutrition/workout pages.
                  </div>
                </div>
              </div>
            </button>

            <p className="text-iron-gray text-xs mt-4 italic">
              💡 Tip: Switch modes anytime using the toggle in the Coach chat header
            </p>
          </div>
        </div>

        {/* Strava Integration */}
        <StravaConnection />

        {/* Garmin Integration */}
        <GarminConnection />

        {error && (
          <div className="text-center text-red-500 border border-red-500 p-4">
            {error}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-iron-orange text-iron-black font-heading text-xl py-4 uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              Saved
            </>
          ) : (
            'Save Changes'
          )}
        </button>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full border-2 border-red-600 text-red-600 font-heading text-xl py-4 uppercase tracking-widest hover:bg-red-600 hover:text-iron-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Signing Out...
            </>
          ) : (
            <>
              <LogOut className="w-5 h-5" />
              Sign Out
            </>
          )}
        </button>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}