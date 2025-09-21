'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Play,
  Pause,
  SkipForward,
  X,
  Weight,
  CheckCircle
} from 'lucide-react';

interface Exercise {
  exercise_id: number;
  exercise_name: string;
  exercise_category: string;
  muscle_group: string;
  equipment: string;
  sets_planned: number;
  reps_planned: string;
  rest_seconds: number;
  order_index: number;
  notes: string;
  sets_completed: number;
  last_weight_used: number | null;
}

interface SetPerformance {
  set_number: number;
  reps: number | null;
  weight: number | null;
}

interface ActiveWorkoutClientProps {
  sessionId: number;
  workoutName: string;
  exercises: Exercise[];
}

export default function ActiveWorkoutClient({
  sessionId,
  workoutName,
  exercises: initialExercises
}: ActiveWorkoutClientProps) {
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [currentReps, setCurrentReps] = useState<string>('');
  const [showWeightInput, setShowWeightInput] = useState(false);
  const [completedSets, setCompletedSets] = useState<Record<string, SetPerformance[]>>({});

  const router = useRouter();
  const supabase = createClient();

  const currentExercise = exercises[currentExerciseIndex];

  // Timer effect
  useEffect(() => {
    if (!isPaused && restTimer === null) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPaused, restTimer]);

  // Rest timer effect
  useEffect(() => {
    if (restTimer !== null && restTimer > 0) {
      const interval = setInterval(() => {
        setRestTimer(prev => (prev !== null && prev > 0) ? prev - 1 : null);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [restTimer]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePause = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).rpc('toggle_workout_pause', {
        p_session_id: sessionId
      });
      setIsPaused(data === 'paused');
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  };

  const logSet = async () => {
    if (!currentExercise) return;

    const weight = currentWeight ? parseFloat(currentWeight) : null;
    const reps = currentReps ? parseInt(currentReps) : null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('log_set_performance', {
        p_session_id: sessionId,
        p_exercise_id: currentExercise.exercise_id,
        p_set_number: currentSet,
        p_reps: reps,
        p_weight: weight
      });

      // Update local state
      const key = `${currentExercise.exercise_id}`;
      setCompletedSets(prev => ({
        ...prev,
        [key]: [
          ...(prev[key] || []),
          { set_number: currentSet, reps, weight }
        ]
      }));

      // Update exercise completion count
      setExercises(prev => prev.map(ex =>
        ex.exercise_id === currentExercise.exercise_id
          ? { ...ex, sets_completed: ex.sets_completed + 1 }
          : ex
      ));

      // Clear inputs
      setCurrentWeight('');
      setCurrentReps('');
      setShowWeightInput(false);

      // Start rest timer if not last set, otherwise auto-advance
      if (currentSet < currentExercise.sets_planned) {
        setRestTimer(currentExercise.rest_seconds);
        setCurrentSet(currentSet + 1);
      } else if (currentExerciseIndex < exercises.length - 1) {
        // Auto advance to next exercise after completing last set
        setTimeout(() => nextExercise(), 1000);
      }
    } catch (error) {
      console.error('Error logging set:', error);
    }
  };


  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setRestTimer(null);
      setCurrentWeight('');
      setCurrentReps('');
    }
  };

  const jumpToExercise = (index: number) => {
    setCurrentExerciseIndex(index);
    setCurrentSet(1);
    setRestTimer(null);
    setCurrentWeight('');
    setCurrentReps('');
  };

  const finishWorkout = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).rpc('complete_workout_session', {
        p_session_id: sessionId
      });

      router.push('/progress');
    } catch (error) {
      console.error('Error finishing workout:', error);
    }
  };

  const cancelWorkout = async () => {
    if (confirm('Are you sure you want to cancel this workout? Progress will be lost.')) {
      try {
        // Update session status to cancelled
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from('active_workout_sessions')
          .update({ status: 'cancelled' })
          .eq('id', sessionId);

        router.push('/dashboard');
      } catch (error) {
        console.error('Error cancelling workout:', error);
      }
    }
  };

  const getExerciseCompletionStatus = (exercise: Exercise, index: number) => {
    if (index < currentExerciseIndex) return 'completed';
    if (index === currentExerciseIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-iron-black">
      {/* Header */}
      <header className="bg-iron-black border-b border-iron-gray sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-heading text-2xl text-iron-orange">{workoutName}</h1>
              <p className="text-iron-gray text-sm">
                Exercise {currentExerciseIndex + 1} of {exercises.length}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-iron-white font-mono text-xl">
                {formatTime(elapsedTime)}
              </div>

              <button
                onClick={togglePause}
                className={`px-4 py-2 border ${isPaused ? 'border-iron-orange text-iron-orange' : 'border-iron-gray text-iron-gray'} hover:border-iron-white hover:text-iron-white transition-colors`}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>

              <button
                onClick={finishWorkout}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors"
              >
                FINISH
              </button>

              <button
                onClick={cancelWorkout}
                className="px-4 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exercise List */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="font-heading text-xl text-iron-white mb-4">EXERCISES</h2>

            {exercises.map((exercise, index) => {
              const status = getExerciseCompletionStatus(exercise, index);
              const key = `${exercise.exercise_id}`;
              const completedCount = completedSets[key]?.length || 0;

              return (
                <button
                  key={exercise.exercise_id}
                  onClick={() => jumpToExercise(index)}
                  className={`w-full text-left p-4 border transition-all ${
                    status === 'current'
                      ? 'border-iron-orange bg-iron-orange/10'
                      : status === 'completed'
                      ? 'border-green-600 bg-green-600/10 opacity-75'
                      : 'border-iron-gray opacity-50 hover:opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-semibold ${
                        status === 'current' ? 'text-iron-orange' :
                        status === 'completed' ? 'text-green-500' : 'text-iron-gray'
                      }`}>
                        {exercise.exercise_name}
                      </p>
                      <p className="text-iron-gray text-sm">
                        {exercise.sets_planned} sets × {exercise.reps_planned} reps
                      </p>
                      <p className="text-iron-gray text-xs">
                        {exercise.muscle_group} • {exercise.equipment}
                      </p>
                    </div>
                    {status === 'completed' && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {status === 'current' && (
                      <div className="text-iron-orange text-sm">
                        {completedCount}/{exercise.sets_planned}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Current Exercise */}
          <div className="lg:col-span-2">
            {restTimer !== null ? (
              // Rest Timer
              <div className="border border-iron-orange p-8 text-center">
                <h2 className="font-heading text-3xl text-iron-orange mb-4">REST BETWEEN SETS</h2>
                <div className="text-6xl font-mono text-iron-white mb-6">
                  {formatTime(restTimer)}
                </div>
                <p className="text-iron-gray mb-2">Preparing for:</p>
                <p className="text-iron-white font-heading text-xl mb-6">
                  Set {currentSet} of {currentExercise?.sets_planned} - {currentExercise?.exercise_name}
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setRestTimer(null)}
                    className="px-6 py-3 bg-iron-orange text-iron-black font-heading hover:bg-iron-white transition-colors"
                  >
                    START NEXT SET
                  </button>
                  <button
                    onClick={nextExercise}
                    className="px-6 py-3 border border-iron-gray text-iron-gray hover:border-iron-white hover:text-iron-white transition-colors"
                  >
                    SKIP TO NEXT EXERCISE
                  </button>
                </div>
              </div>
            ) : currentExercise ? (
              // Active Exercise
              <div className="space-y-6">
                <div className="border border-iron-gray p-6">
                  <h2 className="font-heading text-3xl text-iron-white mb-2">
                    {currentExercise.exercise_name}
                  </h2>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div>
                      <p className="text-iron-gray text-sm">Target</p>
                      <p className="text-iron-white capitalize">{currentExercise.muscle_group}</p>
                    </div>
                    <div>
                      <p className="text-iron-gray text-sm">Equipment</p>
                      <p className="text-iron-white capitalize">{currentExercise.equipment || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-iron-gray text-sm">Rest</p>
                      <p className="text-iron-white">{currentExercise.rest_seconds}s</p>
                    </div>
                  </div>

                  <div className="border-t border-iron-gray pt-6">
                    <h3 className="font-heading text-2xl text-iron-orange mb-4">
                      SET {currentSet} of {currentExercise.sets_planned}
                    </h3>

                    <p className="text-iron-gray mb-4">
                      Target: {currentExercise.reps_planned} reps
                      {currentExercise.notes && ` • ${currentExercise.notes}`}
                    </p>

                    {/* Weight and Reps Input */}
                    <div className="space-y-4 mb-6">
                      {(showWeightInput || currentExercise.equipment !== 'bodyweight') && (
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-iron-gray text-sm block mb-2">Weight (lbs)</label>
                            <input
                              type="number"
                              value={currentWeight}
                              onChange={(e) => setCurrentWeight(e.target.value)}
                              placeholder={currentExercise.last_weight_used?.toString() || '0'}
                              className="w-full bg-iron-gray/10 border border-iron-gray px-4 py-3 text-iron-white focus:border-iron-orange focus:outline-none"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-iron-gray text-sm block mb-2">Reps</label>
                            <input
                              type="number"
                              value={currentReps}
                              onChange={(e) => setCurrentReps(e.target.value)}
                              placeholder={currentExercise.reps_planned}
                              className="w-full bg-iron-gray/10 border border-iron-gray px-4 py-3 text-iron-white focus:border-iron-orange focus:outline-none"
                            />
                          </div>
                        </div>
                      )}

                      {!showWeightInput && currentExercise.equipment === 'bodyweight' && (
                        <button
                          onClick={() => setShowWeightInput(true)}
                          className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
                        >
                          <Weight className="w-4 h-4" />
                          Add weight tracking
                        </button>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={logSet}
                        className="flex-1 bg-iron-orange text-iron-black font-heading text-xl py-4 hover:bg-iron-white transition-colors"
                      >
                        COMPLETE SET
                      </button>

                      {currentSet >= currentExercise.sets_planned && (
                        <button
                          onClick={nextExercise}
                          className="px-6 py-4 border border-iron-orange text-iron-orange hover:bg-iron-orange hover:text-iron-black transition-colors"
                        >
                          <SkipForward className="w-6 h-6" />
                        </button>
                      )}
                    </div>

                    {/* Skip Exercise Option */}
                    <button
                      onClick={nextExercise}
                      className="mt-4 text-iron-gray hover:text-iron-white transition-colors text-sm"
                    >
                      Skip remaining sets and move to next exercise →
                    </button>
                  </div>

                  {/* Completed Sets */}
                  {completedSets[`${currentExercise.exercise_id}`]?.length > 0 && (
                    <div className="border-t border-iron-gray pt-4 mt-6">
                      <h4 className="text-iron-gray text-sm mb-2">Completed Sets</h4>
                      <div className="space-y-1">
                        {completedSets[`${currentExercise.exercise_id}`].map((set, index) => (
                          <div key={index} className="text-iron-white text-sm">
                            Set {set.set_number}: {set.weight ? `${set.weight} lbs × ` : ''}{set.reps || '?'} reps
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Next Exercises Preview */}
                {currentExerciseIndex < exercises.length - 1 && (
                  <div className="border border-iron-gray/50 p-4 opacity-50">
                    <h4 className="text-iron-gray text-sm mb-2">UP NEXT</h4>
                    <p className="text-iron-white">
                      {exercises[currentExerciseIndex + 1].exercise_name}
                    </p>
                    <p className="text-iron-gray text-sm">
                      {exercises[currentExerciseIndex + 1].sets_planned} sets × {exercises[currentExerciseIndex + 1].reps_planned} reps
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Workout Complete
              <div className="border border-green-600 p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="font-heading text-3xl text-iron-white mb-4">
                  ALL EXERCISES COMPLETE!
                </h2>
                <p className="text-iron-gray mb-6">
                  Great work! You&apos;ve completed all exercises.
                </p>
                <button
                  onClick={finishWorkout}
                  className="px-8 py-4 bg-green-600 text-white font-heading text-xl hover:bg-green-700 transition-colors"
                >
                  FINISH WORKOUT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}