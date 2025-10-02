'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import BottomNavigation from '@/app/components/BottomNavigation';

interface ProgramRequest {
  specific_performance_goal?: string;
  event_date?: string;
  weak_points: string[];
  recovery_capacity: string;
  preferred_workout_duration: string;
  additional_context?: string;
}

export default function CreateProgramPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationStatus, setGenerationStatus] = useState<'idle' | 'generating' | 'complete'>('idle');
  const [requestId, setRequestId] = useState<string | null>(null);

  const [data, setData] = useState<ProgramRequest>({
    weak_points: [],
    recovery_capacity: '',
    preferred_workout_duration: '',
  });

  const totalSteps = 5;

  const updateField = (field: keyof ProgramRequest, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const toggleWeakPoint = (point: string) => {
    setData(prev => ({
      ...prev,
      weak_points: prev.weak_points.includes(point)
        ? prev.weak_points.filter(p => p !== point)
        : [...prev.weak_points, point]
    }));
  };

  const canProgress = () => {
    switch (step) {
      case 1: return true; // optional
      case 2: return true; // optional
      case 3: return true; // optional
      case 4: return !!data.recovery_capacity;
      case 5: return !!data.preferred_workout_duration;
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

      // Create program generation request
      const { data: request, error: requestError } = await supabase
        .from('program_generation_requests')
        .insert({
          user_id: user.id,
          ...data,
          status: 'pending'
        })
        .select()
        .single();

      if (requestError) throw requestError;

      setRequestId(request.id);
      setGenerationStatus('generating');

      // Trigger AI generation
      const response = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: request.id })
      });

      if (!response.ok) throw new Error('Failed to generate program');

      const result = await response.json();

      setGenerationStatus('complete');

      // Redirect to dashboard to see new program
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Create program error:', err);
      setError('Failed to create program');
      setGenerationStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Specific Performance Goal?</h2>
            <p className="text-iron-gray text-sm">Optional - Be specific about what you want to achieve</p>
            <textarea
              value={data.specific_performance_goal || ''}
              onChange={(e) => updateField('specific_performance_goal', e.target.value)}
              placeholder="e.g., Run a sub-4 hour marathon, Bench press 315 lbs, Complete a muscle-up"
              rows={4}
              className="w-full bg-iron-black border-2 border-iron-gray text-white p-4 focus:border-iron-orange focus:outline-none resize-none"
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Training for an Event?</h2>
            <p className="text-iron-gray text-sm">Optional - Select date if you have a specific deadline</p>
            <input
              type="date"
              value={data.event_date || ''}
              onChange={(e) => updateField('event_date', e.target.value)}
              className="w-full bg-iron-black border-2 border-iron-gray text-white p-4 focus:border-iron-orange focus:outline-none"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Weak Points or Focus Areas?</h2>
            <p className="text-iron-gray text-sm">Optional - Select areas you want to prioritize</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'upper_body_strength', label: 'Upper Body Strength' },
                { id: 'lower_body_strength', label: 'Lower Body Strength' },
                { id: 'core_strength', label: 'Core Strength' },
                { id: 'cardiovascular_endurance', label: 'Cardiovascular Endurance' },
                { id: 'mobility_flexibility', label: 'Mobility & Flexibility' },
                { id: 'power_explosiveness', label: 'Power & Explosiveness' },
                { id: 'muscular_endurance', label: 'Muscular Endurance' },
                { id: 'balance_stability', label: 'Balance & Stability' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleWeakPoint(option.id)}
                  className={`p-4 border-2 transition-all text-left ${
                    data.weak_points.includes(option.id)
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

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Recovery Capacity?</h2>
            <p className="text-iron-gray text-sm">How well do you recover between workouts?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: 'excellent', label: 'Excellent', sub: 'Young, good sleep, low stress' },
                { id: 'good', label: 'Good', sub: 'Decent sleep, moderate stress' },
                { id: 'fair', label: 'Fair', sub: 'Poor sleep or high stress' },
                { id: 'poor', label: 'Poor', sub: 'Both poor sleep and high stress' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateField('recovery_capacity', option.id)}
                  className={`p-4 border-2 transition-all text-left ${
                    data.recovery_capacity === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-iron-gray">{option.sub}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-heading text-iron-orange">Workout Duration?</h2>
            <p className="text-iron-gray text-sm">How long should each workout session be?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { id: '30-45min', label: '30-45 minutes', sub: 'Quick & efficient' },
                { id: '45-60min', label: '45-60 minutes', sub: 'Standard duration' },
                { id: '60-90min', label: '60-90 minutes', sub: 'Extended sessions' },
                { id: '90+min', label: '90+ minutes', sub: 'Endurance athletes' }
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => updateField('preferred_workout_duration', option.id)}
                  className={`p-4 border-2 transition-all text-left ${
                    data.preferred_workout_duration === option.id
                      ? 'border-iron-orange bg-iron-orange/10'
                      : 'border-iron-gray hover:border-iron-orange/50'
                  }`}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-sm text-iron-gray">{option.sub}</div>
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (generationStatus === 'generating') {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="relative">
            <div className="w-32 h-32 mx-auto relative">
              <div className="absolute inset-0 border-4 border-iron-gray rounded-full"></div>
              <div className="absolute inset-0 border-4 border-iron-orange border-t-transparent rounded-full animate-spin"></div>
              <Sparkles className="w-12 h-12 text-iron-orange absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-heading text-iron-orange uppercase">Generating Your Program</h2>
            <p className="text-iron-gray">
              Creating personalized workouts and meal plans based on your goals...
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm text-iron-gray">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-iron-orange rounded-full animate-pulse"></div>
              <span>Analyzing your profile</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-iron-orange rounded-full animate-pulse animation-delay-200"></div>
              <span>Designing workout structure</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-iron-orange rounded-full animate-pulse animation-delay-400"></div>
              <span>Creating meal plan</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (generationStatus === 'complete') {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-32 h-32 mx-auto bg-iron-orange/20 border-4 border-iron-orange rounded-full flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-iron-orange" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-heading text-iron-orange uppercase">Program Created!</h2>
            <p className="text-iron-gray">
              Your personalized program is ready. Redirecting...
            </p>
          </div>
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
              onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/dashboard')}
              className="text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="font-heading text-2xl text-iron-orange uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Create Program
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
        {/* Progress Bar */}
        <div className="space-y-2 mb-8">
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
          <div className="mt-6 text-center text-iron-orange p-4 border border-iron-orange">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-6 py-3 border-2 border-iron-gray hover:border-iron-orange transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProgress()}
              className="px-6 py-3 bg-iron-orange text-iron-black hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-heading uppercase"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProgress() || loading}
              className="px-8 py-3 bg-iron-orange text-iron-black hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-heading uppercase text-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Program
                </>
              )}
            </button>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
