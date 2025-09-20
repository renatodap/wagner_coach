'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Target, TrendingDown, Dumbbell } from 'lucide-react';

type Goal = 'build_muscle' | 'lose_weight' | 'gain_strength';

export default function OnboardingPage() {
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const goals = [
    {
      id: 'build_muscle' as Goal,
      title: 'BUILD MUSCLE',
      description: 'Pack on lean mass with hypertrophy-focused training',
      icon: <Dumbbell className="w-8 h-8" />,
    },
    {
      id: 'lose_weight' as Goal,
      title: 'LOSE WEIGHT',
      description: 'Burn fat with high-intensity circuits and cardio',
      icon: <TrendingDown className="w-8 h-8" />,
    },
    {
      id: 'gain_strength' as Goal,
      title: 'GAIN STRENGTH',
      description: 'Build raw power with heavy compound movements',
      icon: <Target className="w-8 h-8" />,
    },
  ];

  const handleContinue = async () => {
    if (!selectedGoal) return;

    setLoading(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth');
        return;
      }

      // Update profile with goal and mark onboarding as complete
      const { error: profileError } = await (supabase
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .from('profiles') as any)
        .update({
          goal: selectedGoal,
          onboarding_completed: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Generate first week of workouts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: workoutError } = await (supabase as any)
        .rpc('generate_week_workouts', {
          p_user_id: user.id,
          p_goal: selectedGoal,
        });

      if (workoutError) throw workoutError;

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError((err as Error).message || 'Failed to save goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-heading text-5xl text-iron-orange uppercase tracking-wider">
            Choose Your Path
          </h1>
          <p className="mt-2 text-iron-gray text-lg">
            Select your primary fitness goal to get personalized workouts
          </p>
        </div>

        {/* Goal Selection */}
        <div className="grid gap-6 md:grid-cols-3">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal.id)}
              className={`p-6 border-2 transition-all ${
                selectedGoal === goal.id
                  ? 'border-iron-orange bg-iron-orange/10'
                  : 'border-iron-gray hover:border-iron-orange/50'
              }`}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={selectedGoal === goal.id ? 'text-iron-orange' : 'text-iron-gray'}>
                  {goal.icon}
                </div>
                <h3 className="font-heading text-xl text-iron-white">
                  {goal.title}
                </h3>
                <p className="text-iron-gray text-sm">
                  {goal.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="text-center text-iron-orange">
            {error}
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={!selectedGoal || loading}
          className="w-full bg-iron-orange text-iron-black font-heading text-2xl py-4 uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Workouts...
            </>
          ) : (
            'Start Training'
          )}
        </button>

        <p className="text-center text-iron-gray text-sm">
          You can change your goal anytime in settings
        </p>
      </div>
    </div>
  );
}