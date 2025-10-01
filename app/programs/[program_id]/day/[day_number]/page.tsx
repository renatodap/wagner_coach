'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Utensils, Dumbbell, CheckCircle2, Circle } from 'lucide-react';

interface Food {
  name: string;
  quantity: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
}

interface Exercise {
  name: string;
  sets?: number;
  reps?: string;
  weight?: string;
  duration?: string;
  distance?: string;
  notes?: string;
}

interface Meal {
  id: string;
  meal_type: string;
  meal_name: string;
  foods: Food[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  instructions?: string;
  prep_time_minutes?: number;
  is_completed: boolean;
}

interface Workout {
  id: string;
  workout_type: string;
  workout_name: string;
  exercises: Exercise[];
  duration_minutes?: number;
  intensity?: string;
  notes?: string;
  is_completed: boolean;
}

interface DayInfo {
  day_number: number;
  day_date: string;
  day_name: string;
  notes?: string;
  is_completed: boolean;
  meals: Meal[];
  workouts: Workout[];
}

export default function ProgramDayPage() {
  const router = useRouter();
  const params = useParams();
  const programId = params.program_id as string;
  const dayNumber = parseInt(params.day_number as string);

  const [loading, setLoading] = useState(true);
  const [dayInfo, setDayInfo] = useState<DayInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDayInfo();
  }, [programId, dayNumber]);

  async function fetchDayInfo() {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/programs/${programId}/day/${dayNumber}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch day info');
      }

      const data = await response.json();
      setDayInfo(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load day information');
    } finally {
      setLoading(false);
    }
  }

  async function toggleMealCompletion(mealId: string, currentStatus: boolean) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/programs/meals/${mealId}/complete`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_completed: !currentStatus,
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setDayInfo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            meals: prev.meals.map((meal) =>
              meal.id === mealId ? { ...meal, is_completed: !currentStatus } : meal
            ),
          };
        });
      }
    } catch (err) {
      console.error('Error toggling meal completion:', err);
    }
  }

  async function toggleWorkoutCompletion(workoutId: string, currentStatus: boolean) {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/programs/workouts/${workoutId}/complete`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            is_completed: !currentStatus,
          }),
        }
      );

      if (response.ok) {
        // Update local state
        setDayInfo((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            workouts: prev.workouts.map((workout) =>
              workout.id === workoutId ? { ...workout, is_completed: !currentStatus } : workout
            ),
          };
        });
      }
    } catch (err) {
      console.error('Error toggling workout completion:', err);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center">
        <div className="text-iron-white">Loading...</div>
      </div>
    );
  }

  if (error || !dayInfo) {
    return (
      <div className="min-h-screen bg-iron-black p-4">
        <button
          onClick={() => router.push('/programs')}
          className="flex items-center gap-2 text-iron-white hover:text-iron-orange mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Programs</span>
        </button>
        <div className="text-red-500">{error || 'Day not found'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-black p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push('/programs')}
          className="flex items-center gap-2 text-iron-white hover:text-iron-orange mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Programs</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading text-3xl text-iron-white">
              Day {dayInfo.day_number} - {dayInfo.day_name}
            </h1>
            {dayInfo.is_completed && (
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            )}
          </div>
          <p className="text-iron-gray">
            {new Date(dayInfo.day_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {dayInfo.notes && (
            <p className="text-iron-white mt-2 p-4 bg-iron-black border-2 border-iron-gray">
              {dayInfo.notes}
            </p>
          )}
        </div>

        {/* Meals Section */}
        {dayInfo.meals.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Utensils className="w-6 h-6 text-iron-orange" />
              <h2 className="font-heading text-2xl text-iron-white">MEALS</h2>
            </div>

            <div className="space-y-4">
              {dayInfo.meals.map((meal) => (
                <div
                  key={meal.id}
                  className={`border-2 p-6 ${
                    meal.is_completed
                      ? 'border-green-600 bg-green-600/5'
                      : 'border-iron-gray bg-iron-black'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs text-iron-gray uppercase mb-1">
                        {meal.meal_type.replace('_', ' ')}
                      </div>
                      <h3 className="text-xl font-bold text-iron-white">{meal.meal_name}</h3>
                      {meal.prep_time_minutes && (
                        <p className="text-sm text-iron-gray mt-1">Prep time: {meal.prep_time_minutes} min</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleMealCompletion(meal.id, meal.is_completed)}
                      className="text-iron-gray hover:text-iron-orange"
                    >
                      {meal.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  {/* Nutrition Summary */}
                  {(meal.calories || meal.protein || meal.carbs || meal.fats) && (
                    <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-iron-black border border-iron-gray">
                      {meal.calories && (
                        <div>
                          <div className="text-xs text-iron-gray">Calories</div>
                          <div className="text-lg font-bold text-iron-white">{Math.round(meal.calories)}</div>
                        </div>
                      )}
                      {meal.protein && (
                        <div>
                          <div className="text-xs text-iron-gray">Protein</div>
                          <div className="text-lg font-bold text-iron-white">{Math.round(meal.protein)}g</div>
                        </div>
                      )}
                      {meal.carbs && (
                        <div>
                          <div className="text-xs text-iron-gray">Carbs</div>
                          <div className="text-lg font-bold text-iron-white">{Math.round(meal.carbs)}g</div>
                        </div>
                      )}
                      {meal.fats && (
                        <div>
                          <div className="text-xs text-iron-gray">Fats</div>
                          <div className="text-lg font-bold text-iron-white">{Math.round(meal.fats)}g</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Foods */}
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-iron-gray mb-2">INGREDIENTS</h4>
                    <ul className="space-y-1">
                      {meal.foods.map((food, index) => (
                        <li key={index} className="text-iron-white">
                          • {food.name} - {food.quantity}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Instructions */}
                  {meal.instructions && (
                    <div>
                      <h4 className="text-sm font-bold text-iron-gray mb-2">INSTRUCTIONS</h4>
                      <p className="text-iron-white">{meal.instructions}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Workouts Section */}
        {dayInfo.workouts.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Dumbbell className="w-6 h-6 text-iron-orange" />
              <h2 className="font-heading text-2xl text-iron-white">WORKOUTS</h2>
            </div>

            <div className="space-y-4">
              {dayInfo.workouts.map((workout) => (
                <div
                  key={workout.id}
                  className={`border-2 p-6 ${
                    workout.is_completed
                      ? 'border-green-600 bg-green-600/5'
                      : 'border-iron-gray bg-iron-black'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="text-xs text-iron-gray uppercase mb-1">
                        {workout.workout_type.replace('_', ' ')}
                      </div>
                      <h3 className="text-xl font-bold text-iron-white">{workout.workout_name}</h3>
                      <div className="flex gap-4 mt-1 text-sm text-iron-gray">
                        {workout.duration_minutes && <span>Duration: {workout.duration_minutes} min</span>}
                        {workout.intensity && <span>Intensity: {workout.intensity}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleWorkoutCompletion(workout.id, workout.is_completed)}
                      className="text-iron-gray hover:text-iron-orange"
                    >
                      {workout.is_completed ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      ) : (
                        <Circle className="w-6 h-6" />
                      )}
                    </button>
                  </div>

                  {/* Exercises */}
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-iron-gray mb-2">EXERCISES</h4>
                    <div className="space-y-3">
                      {workout.exercises.map((exercise, index) => (
                        <div key={index} className="p-3 bg-iron-black border border-iron-gray">
                          <div className="font-bold text-iron-white mb-1">{exercise.name}</div>
                          <div className="text-sm text-iron-gray">
                            {exercise.sets && exercise.reps && (
                              <span>{exercise.sets} sets × {exercise.reps} reps</span>
                            )}
                            {exercise.weight && <span> @ {exercise.weight}</span>}
                            {exercise.duration && <span>{exercise.duration}</span>}
                            {exercise.distance && <span> • {exercise.distance}</span>}
                          </div>
                          {exercise.notes && (
                            <div className="text-sm text-iron-gray mt-1">{exercise.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Workout Notes */}
                  {workout.notes && (
                    <div>
                      <h4 className="text-sm font-bold text-iron-gray mb-2">NOTES</h4>
                      <p className="text-iron-white">{workout.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
