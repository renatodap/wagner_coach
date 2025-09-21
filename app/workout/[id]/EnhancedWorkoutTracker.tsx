'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertCircle,
  Clock,
  History,
  Trophy,
  MessageSquare
} from 'lucide-react';
import { UserWorkout } from '@/lib/types';
import RestTimer from '@/components/workout/RestTimer';
import ExerciseHistory from '@/components/workout/ExerciseHistory';
import PRTracker from '@/components/workout/PRTracker';

interface EnhancedWorkoutTrackerProps {
  userWorkout: UserWorkout;
  userId: string;
}

interface SetData {
  reps: number;
  weight: number;
  rpe?: number;
}

export default function EnhancedWorkoutTracker({ userWorkout, userId }: EnhancedWorkoutTrackerProps) {
  const router = useRouter();
  const supabase = createClient();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<Record<string, SetData[]>>({});
  const [loading, setLoading] = useState(false);
  const [startTime] = useState(new Date());
  const [showHistory, setShowHistory] = useState(false);
  const [exerciseNotes, setExerciseNotes] = useState<Record<string, string>>({});
  const [workoutRPE, setWorkoutRPE] = useState<number>(5);
  const [workoutNotes, setWorkoutNotes] = useState('');

  const exercises = userWorkout.workouts?.workout_exercises || [];
  const currentExercise = exercises[currentExerciseIndex];
  const totalExercises = exercises.length;

  const handleSetComplete = (exerciseId: number, setNumber: number, reps: number, weight: number, rpe?: number) => {
    const key = `${exerciseId}`;
    const currentSets = completedSets[key] || [];
    const newSets = [...currentSets];
    newSets[setNumber - 1] = { reps, weight, rpe };

    setCompletedSets({
      ...completedSets,
      [key]: newSets
    });
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setShowHistory(false);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
      setShowHistory(false);
    }
  };

  const handleCompleteWorkout = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create workout completion record with enhanced data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: completion, error: completionError } = await (supabase as any)
        .from('workout_completions')
        .insert({
          user_id: user.id,
          user_workout_id: userWorkout.id,
          workout_id: userWorkout.workout_id,
          started_at: startTime.toISOString(),
          completed_at: new Date().toISOString(),
          notes: workoutNotes,
          // These columns would need to be added to the database
          // rpe: workoutRPE,
        })
        .select()
        .single();

      if (completionError) throw completionError;

      // Record exercise completions with notes
      for (const exercise of exercises) {
        const key = `${exercise.exercise_id}`;
        const sets = completedSets[key] || [];

        if (sets.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error: exerciseError } = await (supabase as any)
            .from('exercise_completions')
            .insert({
              completion_id: completion.id,
              exercise_id: exercise.exercise_id,
              sets_completed: sets.length,
              reps_completed: sets.map(s => s.reps),
              weight_kg: sets.map(s => s.weight),
              notes: exerciseNotes[key] || null,
            });

          if (exerciseError) throw exerciseError;
        }
      }

      // Mark user workout as completed
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('user_workouts')
        .update({ completed: true })
        .eq('id', userWorkout.id);

      if (updateError) throw updateError;

      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentExercise) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <p>No exercises found</p>
      </div>
    );
  }

  const currentSetData = completedSets[`${currentExercise.exercise_id}`] || [];
  const lastCompletedSet = currentSetData[currentSetData.length - 1];

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Exit</span>
            </Link>
            <div className="text-center">
              <p className="text-iron-gray text-sm">
                Exercise {currentExerciseIndex + 1} of {totalExercises}
              </p>
            </div>
            <div className="flex items-center gap-2 text-iron-gray">
              <Clock className="w-4 h-4" />
              <span className="font-mono text-sm">
                {Math.floor((Date.now() - startTime.getTime()) / 60000)}:
                {String(Math.floor((Date.now() - startTime.getTime()) / 1000) % 60).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-iron-gray/30">
            <div
              className="h-full bg-iron-orange transition-all duration-300"
              style={{ width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 space-y-6">
        {/* Exercise Name */}
        <div className="text-center">
          <h1 className="font-heading text-4xl text-iron-orange uppercase tracking-wider mb-2">
            {currentExercise.exercises?.name}
          </h1>
          <p className="text-iron-gray">
            {currentExercise.sets} sets × {currentExercise.reps} reps
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 ${
              showHistory ? 'border-iron-orange text-iron-orange' : 'border-iron-gray text-iron-gray'
            } hover:border-iron-orange hover:text-iron-orange transition-colors`}
          >
            <History className="w-4 h-4" />
            <span className="font-heading uppercase">History</span>
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 py-2 border-2 border-iron-gray text-iron-gray hover:border-iron-orange hover:text-iron-orange transition-colors"
          >
            <Trophy className="w-4 h-4" />
            <span className="font-heading uppercase">PRs</span>
          </button>
        </div>

        {/* Exercise History */}
        {showHistory && currentExercise.exercises && (
          <ExerciseHistory
            exerciseId={currentExercise.exercise_id}
            exerciseName={currentExercise.exercises.name}
            userId={userId}
          />
        )}

        {/* PR Tracker */}
        {lastCompletedSet && currentExercise.exercises && (
          <PRTracker
            exerciseId={currentExercise.exercise_id}
            exerciseName={currentExercise.exercises.name}
            currentWeight={lastCompletedSet.weight}
            currentReps={lastCompletedSet.reps}
            userId={userId}
          />
        )}

        {/* Notes */}
        {currentExercise.notes && (
          <div className="bg-iron-gray/10 border border-iron-gray p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-iron-orange mt-0.5" />
              <p className="text-iron-gray text-sm">{currentExercise.notes}</p>
            </div>
          </div>
        )}

        {/* Set Tracking */}
        <div className="space-y-4">
          <h3 className="font-heading text-xl text-iron-white">TRACK SETS</h3>
          {Array.from({ length: currentExercise.sets }, (_, i) => {
            const setNumber = i + 1;
            const key = `${currentExercise.exercise_id}`;
            const setData = completedSets[key]?.[i];

            return (
              <div
                key={setNumber}
                className={`border p-4 ${
                  setData ? 'border-green-500 bg-green-900/10' : 'border-iron-gray'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-heading text-lg text-iron-white">
                    SET {setNumber}
                  </span>
                  {setData && <CheckCircle className="w-5 h-5 text-green-500" />}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-iron-gray text-xs uppercase mb-1">
                      Reps
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder={String(currentExercise.reps)}
                      value={setData?.reps || ''}
                      onChange={(e) => {
                        const reps = parseInt(e.target.value) || 0;
                        const weight = setData?.weight || 0;
                        const rpe = setData?.rpe;
                        handleSetComplete(currentExercise.exercise_id, setNumber, reps, weight, rpe);
                      }}
                      className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white focus:outline-none focus:border-iron-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-iron-gray text-xs uppercase mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="2.5"
                      placeholder="0"
                      value={setData?.weight || ''}
                      onChange={(e) => {
                        const weight = parseFloat(e.target.value) || 0;
                        const reps = setData?.reps || 0;
                        const rpe = setData?.rpe;
                        handleSetComplete(currentExercise.exercise_id, setNumber, reps, weight, rpe);
                      }}
                      className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white focus:outline-none focus:border-iron-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-iron-gray text-xs uppercase mb-1">
                      RPE
                    </label>
                    <select
                      value={setData?.rpe || ''}
                      onChange={(e) => {
                        const rpe = parseInt(e.target.value) || undefined;
                        const reps = setData?.reps || 0;
                        const weight = setData?.weight || 0;
                        handleSetComplete(currentExercise.exercise_id, setNumber, reps, weight, rpe);
                      }}
                      className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white focus:outline-none focus:border-iron-orange"
                    >
                      <option value="">--</option>
                      {[...Array(10)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest Timer */}
        {currentSetData.length > 0 && currentSetData.length < currentExercise.sets && (
          <RestTimer
            defaultSeconds={currentExercise.rest_seconds || 90}
            autoStart={true}
          />
        )}

        {/* Exercise Notes */}
        <div>
          <label className="flex items-center gap-2 text-iron-gray text-sm uppercase mb-2">
            <MessageSquare className="w-4 h-4" />
            Exercise Notes
          </label>
          <textarea
            value={exerciseNotes[`${currentExercise.exercise_id}`] || ''}
            onChange={(e) => setExerciseNotes({
              ...exerciseNotes,
              [`${currentExercise.exercise_id}`]: e.target.value
            })}
            placeholder="How did this exercise feel? Any form notes?"
            className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white focus:outline-none focus:border-iron-orange h-20"
          />
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
            className="flex-1 border-2 border-iron-gray text-iron-gray py-3 uppercase font-heading tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:border-iron-orange hover:text-iron-orange transition-colors"
          >
            <ChevronLeft className="inline w-5 h-5 mr-2" />
            Previous
          </button>

          {currentExerciseIndex === totalExercises - 1 ? (
            <button
              onClick={handleCompleteWorkout}
              disabled={loading}
              className="flex-1 bg-green-600 text-iron-white py-3 uppercase font-heading tracking-wider hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete Workout
                  <CheckCircle className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNextExercise}
              className="flex-1 bg-iron-orange text-iron-black py-3 uppercase font-heading tracking-wider hover:bg-orange-600 transition-colors"
            >
              Next
              <ChevronRight className="inline w-5 h-5 ml-2" />
            </button>
          )}
        </div>

        {/* Workout Completion Form (shown on last exercise) */}
        {currentExerciseIndex === totalExercises - 1 && (
          <div className="border-t border-iron-gray pt-6 space-y-4">
            <h3 className="font-heading text-xl text-iron-white">WORKOUT SUMMARY</h3>

            <div>
              <label className="block text-iron-gray text-sm uppercase mb-2">
                Overall RPE (1-10)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={workoutRPE}
                onChange={(e) => setWorkoutRPE(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-iron-gray text-xs mt-1">
                <span>Easy</span>
                <span className="text-iron-orange font-heading text-lg">{workoutRPE}</span>
                <span>Max Effort</span>
              </div>
            </div>

            <div>
              <label className="block text-iron-gray text-sm uppercase mb-2">
                Workout Notes
              </label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="How was your workout? Energy levels, mood, any issues?"
                className="w-full bg-iron-black border border-iron-gray px-3 py-2 text-iron-white focus:outline-none focus:border-iron-orange h-24"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}