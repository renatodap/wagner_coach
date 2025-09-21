'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { Play, Pause, Check, X, Clock, Weight } from 'lucide-react';

interface Exercise {
  id: number;
  name: string;
  sets: number;
  reps: number;
  rest_seconds: number;
}

interface SetPerformance {
  weight: number;
  reps: number;
  completed: boolean;
}

interface ActiveSession {
  id: number;
  workout_id: number;
  workout_name: string;
  workout_type: string;
  difficulty: string;
  status: 'active' | 'paused' | 'completed';
  started_at: string;
  paused_at: string | null;
  total_pause_duration_seconds: number;
  current_exercise_index: number;
  current_set_index: number;
}

export default function ActiveWorkoutPage() {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [setPerformances, setSetPerformances] = useState<Record<string, SetPerformance>>({});
  const [currentWeight, setCurrentWeight] = useState(0);
  const [currentReps, setCurrentReps] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const sessionId = parseInt(params?.sessionId as string);

  useEffect(() => {
    fetchSession();
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    if (session && !isPaused) {
      timerInterval.current = setInterval(() => {
        const start = new Date(session.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000) - session.total_pause_duration_seconds;
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [session, isPaused]);

  useEffect(() => {
    if (exercises.length > 0 && session) {
      setCurrentExercise(exercises[session.current_exercise_index] || exercises[0]);
      setCurrentReps(exercises[session.current_exercise_index]?.reps || 0);
    }
  }, [exercises, session]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const fetchSession = async () => {
    try {
      // Fetch active session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: sessionData } = await (supabase as any)
        .from('user_active_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionData) {
        setSession(sessionData);
        setIsPaused(sessionData.status === 'paused');

        // Fetch workout exercises
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: exerciseData } = await (supabase as any)
          .from('workout_exercises')
          .select('*, exercises(*)')
          .eq('workout_id', sessionData.workout_id)
          .order('order_index');

        if (exerciseData) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedExercises = exerciseData.map((we: any) => ({
            id: we.exercise_id,
            name: we.exercises.name,
            sets: we.sets,
            reps: parseInt(we.reps) || 10, // Parse text field to number
            rest_seconds: we.rest_seconds || 90
          }));
          setExercises(formattedExercises);
        }
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePause = async () => {
    if (!session) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newStatus } = await (supabase as any).rpc('toggle_workout_pause', {
        p_session_id: sessionId
      });

      setIsPaused(newStatus === 'paused');
      setSession({ ...session, status: newStatus });
    } catch (error) {
      console.error('Error toggling pause:', error);
    }
  };

  const completeSet = async () => {
    if (!currentExercise || !session || !userId) return;

    const key = `${currentExercise.id}-${session.current_set_index}`;

    // Save set performance
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('set_performances')
      .insert({
        user_id: userId,
        session_id: sessionId,
        exercise_id: currentExercise.id,
        set_number: session.current_set_index + 1,
        target_reps: currentExercise.reps,
        actual_reps: currentReps,
        weight_kg: currentWeight
      });

    setSetPerformances({
      ...setPerformances,
      [key]: {
        weight: currentWeight,
        reps: currentReps,
        completed: true
      }
    });

    // Move to next set or exercise
    if (session.current_set_index < currentExercise.sets - 1) {
      // Next set
      const newSetIndex = session.current_set_index + 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('active_workout_sessions')
        .update({ current_set_index: newSetIndex })
        .eq('id', sessionId);

      setSession({ ...session, current_set_index: newSetIndex });
    } else if (session.current_exercise_index < exercises.length - 1) {
      // Next exercise
      const newExerciseIndex = session.current_exercise_index + 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('active_workout_sessions')
        .update({
          current_exercise_index: newExerciseIndex,
          current_set_index: 0
        })
        .eq('id', sessionId);

      setSession({
        ...session,
        current_exercise_index: newExerciseIndex,
        current_set_index: 0
      });
      setCurrentWeight(0);
    } else {
      // Workout completed
      setShowNotes(true);
    }
  };

  const finishWorkout = async () => {
    if (!session || !userId) return;

    try {
      // Update session status
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('active_workout_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);

      // Create workout completion record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('workout_completions')
        .insert({
          user_id: userId,
          workout_id: session.workout_id,
          started_at: session.started_at,
          completed_at: new Date().toISOString(),
          duration_minutes: Math.floor(elapsedTime / 60),
          notes: workoutNotes,
          total_pause_duration_seconds: session.total_pause_duration_seconds
        });

      router.push('/progress');
    } catch (error) {
      console.error('Error finishing workout:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center">
        <p className="text-iron-gray">Loading workout...</p>
      </div>
    );
  }

  if (!session || !currentExercise) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center">
        <p className="text-iron-gray">Session not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-black">
      {/* Timer Header */}
      <div className="sticky top-0 bg-iron-black border-b border-iron-gray z-40">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-heading text-2xl text-iron-white">
                {session.workout_name}
              </h2>
              <div className="flex items-center gap-2 text-iron-gray">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
                {isPaused && <span className="text-iron-orange">(PAUSED)</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={togglePause}
                className={`p-3 border ${isPaused ? 'bg-iron-orange border-iron-orange' : 'border-iron-gray'} hover:border-iron-orange transition-colors`}
              >
                {isPaused ? <Play className="w-5 h-5 text-iron-black" /> : <Pause className="w-5 h-5 text-iron-white" />}
              </button>
              <button
                onClick={() => router.push('/workout')}
                className="p-3 border border-iron-gray text-iron-gray hover:border-red-500 hover:text-red-500 transition-colors"
                title="Exit workout"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Exercise List */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-3 mb-24">
          {exercises.map((exercise, index) => {
            const isActive = index === session.current_exercise_index;
            const isCompleted = index < session.current_exercise_index;

            return (
              <div
                key={exercise.id}
                className={`border p-4 transition-all ${
                  isActive
                    ? 'border-iron-orange bg-iron-orange/10'
                    : isCompleted
                    ? 'border-green-500 bg-green-500/10 opacity-50'
                    : 'border-iron-gray opacity-30'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className={`font-heading text-xl ${isActive ? 'text-iron-orange' : 'text-iron-white'}`}>
                      {exercise.name}
                    </h3>
                    <p className="text-iron-gray">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>

                    {/* Sets Progress for Active Exercise */}
                    {isActive && (
                      <div className="mt-3 space-y-2">
                        <div className="flex gap-2">
                          {Array.from({ length: exercise.sets }).map((_, setIndex) => {
                            const setKey = `${exercise.id}-${setIndex}`;
                            const perf = setPerformances[setKey];
                            const isCurrent = setIndex === session.current_set_index;

                            return (
                              <div
                                key={setIndex}
                                className={`flex-1 p-2 border text-center ${
                                  isCurrent
                                    ? 'border-iron-orange bg-iron-orange/20'
                                    : perf?.completed
                                    ? 'border-green-500 bg-green-500/20'
                                    : 'border-iron-gray'
                                }`}
                              >
                                <p className="text-xs text-iron-gray mb-1">Set {setIndex + 1}</p>
                                {perf?.completed ? (
                                  <p className="text-iron-white text-sm">
                                    {perf.weight}kg × {perf.reps}
                                  </p>
                                ) : isCurrent ? (
                                  <p className="text-iron-orange">Current</p>
                                ) : (
                                  <p className="text-iron-gray">-</p>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Weight and Reps Input for Current Set */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-iron-gray text-xs uppercase block mb-1">
                              Weight (kg)
                            </label>
                            <div className="relative">
                              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-iron-gray" />
                              <input
                                type="number"
                                value={currentWeight || ''}
                                onChange={(e) => setCurrentWeight(parseFloat(e.target.value) || 0)}
                                className="w-full bg-iron-gray/10 border border-iron-gray pl-10 pr-3 py-2 text-iron-white focus:border-iron-orange focus:outline-none"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-iron-gray text-xs uppercase block mb-1">
                              Reps
                            </label>
                            <input
                              type="number"
                              value={currentReps || ''}
                              onChange={(e) => setCurrentReps(parseInt(e.target.value) || 0)}
                              className="w-full bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:border-iron-orange focus:outline-none"
                              placeholder={exercise.reps.toString()}
                            />
                          </div>
                        </div>

                        <button
                          onClick={completeSet}
                          className="w-full bg-iron-orange text-iron-black font-heading py-3 hover:bg-iron-white transition-colors flex items-center justify-center gap-2"
                        >
                          <Check className="w-5 h-5" />
                          COMPLETE SET {session.current_set_index + 1} OF {exercise.sets}
                        </button>
                      </div>
                    )}
                  </div>

                  {isCompleted && (
                    <Check className="w-6 h-6 text-green-500 mt-1" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-iron-black border-t border-iron-gray">
        <div className="max-w-4xl mx-auto p-4">
          <button
            onClick={() => setShowNotes(true)}
            className="w-full bg-iron-orange text-iron-black font-heading text-xl py-4 hover:bg-iron-white transition-colors"
          >
            FINISH WORKOUT
          </button>
        </div>
      </div>

      {/* Notes Modal */}
      {showNotes && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-iron-black border border-iron-orange max-w-lg w-full p-6">
            <h2 className="font-heading text-2xl text-iron-orange mb-4">
              WORKOUT COMPLETE!
            </h2>

            <div className="mb-4">
              <p className="text-iron-gray mb-2">Total Time: {formatTime(elapsedTime)}</p>
              <p className="text-iron-gray">Exercises Completed: {session.current_exercise_index + 1}/{exercises.length}</p>
            </div>

            <label className="text-iron-gray text-sm uppercase block mb-2">
              How did it go? (optional)
            </label>
            <textarea
              value={workoutNotes}
              onChange={(e) => setWorkoutNotes(e.target.value)}
              className="w-full bg-iron-gray/10 border border-iron-gray p-3 text-iron-white placeholder-iron-gray focus:border-iron-orange focus:outline-none mb-4"
              rows={4}
              placeholder="Great workout! Felt strong on bench press..."
            />

            <div className="flex gap-3">
              <button
                onClick={finishWorkout}
                className="flex-1 bg-iron-orange text-iron-black font-heading py-3 hover:bg-iron-white transition-colors"
              >
                SAVE & FINISH
              </button>
              <button
                onClick={() => setShowNotes(false)}
                className="px-6 py-3 border border-iron-gray text-iron-gray hover:border-iron-white hover:text-iron-white transition-colors"
              >
                BACK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}