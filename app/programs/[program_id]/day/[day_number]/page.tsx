'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Dumbbell, UtensilsCrossed, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface Workout {
  id: string;
  name: string;
  workout_type: string;
  duration_minutes: number;
  exercises: Exercise[];
  is_completed: boolean;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  notes?: string;
  weight_guidance?: string;
}

interface Meal {
  id: string;
  name: string;
  meal_type: string;
  meal_time: string | null;
  meal_order: number;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  foods: Food[];
  is_completed: boolean;
}

interface Food {
  item: string;
  quantity: string;
  calories: number;
}

interface DayData {
  day_number: number;
  day_date: string;
  day_name: string;
  day_focus: string;
  is_completed: boolean;
}

export default function DayDetailPage() {
  const router = useRouter();
  const params = useParams();
  const program_id = params.program_id as string;
  const day_number = parseInt(params.day_number as string);

  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState<DayData | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchDayDetails();
  }, [program_id, day_number]);

  async function fetchDayDetails() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch day data
      const { data: day, error: dayError } = await supabase
        .from('ai_program_days')
        .select('*')
        .eq('program_id', program_id)
        .eq('day_number', day_number)
        .single();

      if (dayError || !day) {
        console.error('Error fetching day:', dayError);
        setLoading(false);
        return;
      }

      setDayData({
        day_number: day.day_number,
        day_date: day.day_date,
        day_name: day.day_name || '',
        day_focus: day.day_focus || '',
        is_completed: day.is_completed || false
      });

      // Fetch workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('ai_program_workouts')
        .select('*')
        .eq('program_day_id', day.id)
        .order('workout_order', { ascending: true });

      if (!workoutsError && workoutsData) {
        setWorkouts(workoutsData.map(w => ({
          id: w.id,
          name: w.name,
          workout_type: w.workout_type,
          duration_minutes: w.duration_minutes,
          exercises: w.exercises || [],
          is_completed: w.is_completed || false
        })));
      }

      // Fetch meals
      const { data: mealsData, error: mealsError } = await supabase
        .from('ai_program_meals')
        .select('*')
        .eq('program_day_id', day.id)
        .order('meal_order', { ascending: true });

      if (!mealsError && mealsData) {
        setMeals(mealsData.map(m => ({
          id: m.id,
          name: m.name,
          meal_type: m.meal_type,
          meal_time: m.meal_time,
          meal_order: m.meal_order,
          total_calories: m.total_calories || 0,
          total_protein_g: m.total_protein_g || 0,
          total_carbs_g: m.total_carbs_g || 0,
          total_fat_g: m.total_fat_g || 0,
          foods: m.foods || [],
          is_completed: m.is_completed || false
        })));
      }

    } catch (error) {
      console.error('Error fetching day details:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleWorkout(workoutId: string) {
    setExpandedWorkouts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workoutId)) {
        newSet.delete(workoutId);
      } else {
        newSet.add(workoutId);
      }
      return newSet;
    });
  }

  function toggleMeal(mealId: string) {
    setExpandedMeals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mealId)) {
        newSet.delete(mealId);
      } else {
        newSet.add(mealId);
      }
      return newSet;
    });
  }

  async function markDayComplete() {
    if (!dayData) return;

    try {
      const supabase = createClient();

      const { data: day } = await supabase
        .from('ai_program_days')
        .select('id')
        .eq('program_id', program_id)
        .eq('day_number', day_number)
        .single();

      if (day) {
        await supabase
          .from('ai_program_days')
          .update({
            is_completed: true,
            completed_at: new Date().toISOString()
          })
          .eq('id', day.id);

        setDayData({ ...dayData, is_completed: true });
      }
    } catch (error) {
      console.error('Error marking day complete:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center">
        <div className="text-iron-white">Loading...</div>
      </div>
    );
  }

  if (!dayData) {
    return (
      <div className="min-h-screen bg-iron-black flex items-center justify-center">
        <div className="text-iron-white">Day not found</div>
      </div>
    );
  }

  const totalCalories = meals.reduce((sum, m) => sum + m.total_calories, 0);
  const totalProtein = meals.reduce((sum, m) => sum + m.total_protein_g, 0);

  return (
    <div className="min-h-screen bg-iron-black p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push(`/programs`)}
            className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Program</span>
          </button>
          {dayData.is_completed && (
            <div className="flex items-center gap-2 text-green-500">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm">Completed</span>
            </div>
          )}
        </div>

        {/* Day Info */}
        <div className="bg-iron-black border-2 border-iron-gray p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-heading text-3xl text-iron-white">
              DAY {dayData.day_number}
            </h1>
            <span className="text-iron-gray text-sm">
              {new Date(dayData.day_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
          {dayData.day_focus && (
            <p className="text-iron-gray mb-4">{dayData.day_focus}</p>
          )}
          <div className="flex gap-4 text-sm">
            <div className="text-iron-white">
              <span className="text-iron-gray">Workouts:</span> {workouts.length}
            </div>
            <div className="text-iron-white">
              <span className="text-iron-gray">Meals:</span> {meals.length}
            </div>
            <div className="text-iron-white">
              <span className="text-iron-gray">Total Calories:</span> {totalCalories}
            </div>
            <div className="text-iron-white">
              <span className="text-iron-gray">Protein:</span> {totalProtein}g
            </div>
          </div>
        </div>

        {/* Workouts Section */}
        {workouts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Dumbbell className="w-6 h-6 text-iron-orange" />
              <h2 className="font-heading text-2xl text-iron-white">WORKOUTS</h2>
            </div>
            <div className="space-y-4">
              {workouts.map((workout) => {
                const isExpanded = expandedWorkouts.has(workout.id);
                return (
                  <div key={workout.id} className="bg-iron-black border-2 border-iron-gray">
                    <button
                      onClick={() => toggleWorkout(workout.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-iron-gray/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <div className="font-bold text-iron-white text-lg">{workout.name}</div>
                          <div className="text-iron-gray text-sm">
                            {workout.duration_minutes} min • {workout.exercises.length} exercises • {workout.workout_type}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-iron-gray" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-iron-gray" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t-2 border-iron-gray p-4">
                        <div className="space-y-4">
                          {workout.exercises.map((exercise, idx) => (
                            <div key={idx} className="bg-iron-gray/5 p-4 border-l-4 border-iron-orange">
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-iron-white">{exercise.name}</div>
                                <div className="text-iron-orange text-sm font-mono">
                                  {exercise.sets} × {exercise.reps}
                                </div>
                              </div>
                              {exercise.weight_guidance && (
                                <div className="text-sm text-iron-gray mb-1">
                                  Weight: {exercise.weight_guidance}
                                </div>
                              )}
                              <div className="text-sm text-iron-gray mb-1">
                                Rest: {exercise.rest_seconds}s
                              </div>
                              {exercise.notes && (
                                <div className="text-sm text-iron-gray italic mt-2">
                                  💡 {exercise.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Meals Section */}
        {meals.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="w-6 h-6 text-iron-orange" />
              <h2 className="font-heading text-2xl text-iron-white">MEALS</h2>
            </div>
            <div className="space-y-4">
              {meals.map((meal) => {
                const isExpanded = expandedMeals.has(meal.id);
                const mealIcon = getMealIcon(meal.meal_type);

                return (
                  <div key={meal.id} className="bg-iron-black border-2 border-iron-gray">
                    <button
                      onClick={() => toggleMeal(meal.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-iron-gray/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{mealIcon}</span>
                        <div className="text-left">
                          <div className="font-bold text-iron-white text-lg">{meal.name}</div>
                          <div className="text-iron-gray text-sm">
                            {meal.meal_time && `${meal.meal_time} • `}
                            {meal.total_calories} cal • {meal.total_protein_g}g protein
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-iron-gray" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-iron-gray" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="border-t-2 border-iron-gray p-4">
                        {/* Macros */}
                        <div className="grid grid-cols-4 gap-4 mb-4 pb-4 border-b border-iron-gray">
                          <div>
                            <div className="text-xs text-iron-gray">Calories</div>
                            <div className="text-lg font-bold text-iron-white">{meal.total_calories}</div>
                          </div>
                          <div>
                            <div className="text-xs text-iron-gray">Protein</div>
                            <div className="text-lg font-bold text-iron-orange">{meal.total_protein_g}g</div>
                          </div>
                          <div>
                            <div className="text-xs text-iron-gray">Carbs</div>
                            <div className="text-lg font-bold text-iron-white">{meal.total_carbs_g}g</div>
                          </div>
                          <div>
                            <div className="text-xs text-iron-gray">Fat</div>
                            <div className="text-lg font-bold text-iron-white">{meal.total_fat_g}g</div>
                          </div>
                        </div>

                        {/* Foods */}
                        <div className="space-y-2">
                          {meal.foods.map((food, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-iron-gray/30 last:border-0">
                              <div>
                                <div className="text-iron-white">{food.item}</div>
                                <div className="text-sm text-iron-gray">{food.quantity}</div>
                              </div>
                              <div className="text-iron-gray text-sm">{food.calories} cal</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Complete Day Button */}
        {!dayData.is_completed && (
          <button
            onClick={markDayComplete}
            className="w-full bg-iron-orange hover:bg-orange-600 text-white font-bold py-4 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            MARK DAY AS COMPLETE
          </button>
        )}
      </div>
    </div>
  );
}

function getMealIcon(mealType: string): string {
  const icons: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍎',
    pre_workout: '💪',
    post_workout: '🥤'
  };
  return icons[mealType] || '🍽️';
}
