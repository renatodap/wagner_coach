'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Plus,
  Search,
  Save,
  X,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Copy,
  Trash2,
  Edit,
  Filter,
  Tag
} from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment?: string;
  difficulty?: string;
}

interface CustomExercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment?: string;
}

interface WorkoutExercise {
  id: string;
  exerciseId?: number;
  customExerciseName?: string;
  exercise?: Exercise;
  customExercise?: CustomExercise;
  orderIndex: number;
  sets: number;
  reps: string;
  weightValue?: number;
  weightUnit: 'kg' | 'lbs' | 'bodyweight' | '%1rm';
  durationSeconds?: number;
  restSeconds: number;
  instructions?: string;
  notes?: string;
  supersetGroup?: number;
}

interface WorkoutBuilderClientProps {
  exercises: Exercise[];
  customExercises: CustomExercise[];
  userId: string;
}

export default function WorkoutBuilderClient({
  exercises,
  customExercises,
  userId
}: WorkoutBuilderClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const draggedItem = useRef<WorkoutExercise | null>(null);
  const draggedOverItem = useRef<WorkoutExercise | null>(null);

  // Workout metadata
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutType, setWorkoutType] = useState<string>('strength');
  const [difficulty, setDifficulty] = useState<string>('intermediate');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);

  // Exercise management
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showExerciseLibrary, setShowExerciseLibrary] = useState(false);
  const [editingExercise, setEditingExercise] = useState<WorkoutExercise | null>(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculate estimated duration
  const estimatedDuration = workoutExercises.reduce((total, ex) => {
    const exerciseTime = ex.durationSeconds || (ex.sets * 30); // 30s per set estimate
    return total + exerciseTime + (ex.restSeconds || 0);
  }, 0) / 60; // Convert to minutes

  // Filter exercises based on search and category
  const filteredExercises = [...exercises, ...customExercises].filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Drag and drop handlers
  const handleDragStart = (exercise: WorkoutExercise) => {
    draggedItem.current = exercise;
  };

  const handleDragEnter = (exercise: WorkoutExercise) => {
    draggedOverItem.current = exercise;
  };

  const handleDragEnd = () => {
    if (draggedItem.current && draggedOverItem.current) {
      const draggedIndex = workoutExercises.findIndex(ex => ex.id === draggedItem.current?.id);
      const targetIndex = workoutExercises.findIndex(ex => ex.id === draggedOverItem.current?.id);

      if (draggedIndex !== -1 && targetIndex !== -1 && draggedIndex !== targetIndex) {
        const newExercises = [...workoutExercises];
        const [movedItem] = newExercises.splice(draggedIndex, 1);
        newExercises.splice(targetIndex, 0, movedItem);

        // Update order indices
        newExercises.forEach((ex, index) => {
          ex.orderIndex = index;
        });

        setWorkoutExercises(newExercises);
      }
    }

    draggedItem.current = null;
    draggedOverItem.current = null;
  };

  // Add exercise to workout
  const addExerciseToWorkout = (exercise: Exercise | CustomExercise) => {
    const newExercise: WorkoutExercise = {
      id: `temp-${Date.now()}`,
      exerciseId: 'id' in exercise && typeof exercise.id === 'number' ? exercise.id : undefined,
      customExerciseName: 'id' in exercise && typeof exercise.id === 'string' ? exercise.name : undefined,
      exercise: 'id' in exercise && typeof exercise.id === 'number' ? exercise : undefined,
      customExercise: 'id' in exercise && typeof exercise.id === 'string' ? exercise : undefined,
      orderIndex: workoutExercises.length,
      sets: 3,
      reps: '8-12',
      weightUnit: 'kg',
      restSeconds: 60,
    };

    setWorkoutExercises([...workoutExercises, newExercise]);
    setShowExerciseLibrary(false);
  };

  // Remove exercise from workout
  const removeExercise = (exerciseId: string) => {
    setWorkoutExercises(workoutExercises.filter(ex => ex.id !== exerciseId));
  };

  // Duplicate exercise
  const duplicateExercise = (exercise: WorkoutExercise) => {
    const newExercise = {
      ...exercise,
      id: `temp-${Date.now()}`,
      orderIndex: workoutExercises.length
    };
    setWorkoutExercises([...workoutExercises, newExercise]);
  };

  // Update exercise details
  const updateExercise = (exerciseId: string, updates: Partial<WorkoutExercise>) => {
    setWorkoutExercises(workoutExercises.map(ex =>
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!workoutName.trim()) {
      newErrors.name = 'Workout name is required';
    }

    if (workoutExercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save workout
  const handleSaveWorkout = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Save workout
      const { data: workout, error: workoutError } = await supabase
        .from('user_custom_workouts')
        .insert({
          user_id: userId,
          name: workoutName,
          description: workoutDescription,
          type: workoutType,
          difficulty,
          estimated_duration_minutes: Math.round(estimatedDuration),
          equipment_required: equipment,
          tags,
          is_public: false
        })
        .select()
        .single();

      if (workoutError) throw workoutError;

      // Save exercises
      const exercisesToSave = workoutExercises.map(ex => ({
        workout_id: workout.id,
        exercise_id: ex.exerciseId,
        custom_exercise_name: ex.customExerciseName,
        order_index: ex.orderIndex,
        sets: ex.sets,
        reps: ex.reps,
        weight_unit: ex.weightUnit,
        weight_value: ex.weightValue,
        duration_seconds: ex.durationSeconds,
        rest_seconds: ex.restSeconds,
        instructions: ex.instructions,
        notes: ex.notes,
        superset_group: ex.supersetGroup
      }));

      const { error: exerciseError } = await supabase
        .from('user_workout_exercises')
        .insert(exercisesToSave);

      if (exerciseError) throw exerciseError;

      router.push(`/workouts/custom/${workout.id}`);
    } catch (error) {
      console.error('Error saving workout:', error);
      setErrors({ save: 'Failed to save workout' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white pb-20">
      {/* Header */}
      <header className="border-b border-iron-gray sticky top-0 bg-iron-black z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-2xl text-iron-orange">WORKOUT BUILDER</h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="text-iron-gray hover:text-iron-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveWorkout}
                disabled={saving}
                size="sm"
                className="bg-iron-orange text-iron-black hover:bg-orange-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Workout'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Workout Details */}
        <div className="bg-iron-gray/10 border border-iron-gray p-6 space-y-4">
          <h2 className="font-heading text-xl text-iron-white">WORKOUT DETAILS</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-iron-gray">Workout Name *</Label>
              <Input
                id="name"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Upper Body Power"
                className="bg-iron-black border-iron-gray text-iron-white"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="text-iron-gray">Workout Type</Label>
              <Select value={workoutType} onValueChange={setWorkoutType}>
                <SelectTrigger className="bg-iron-black border-iron-gray text-iron-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-iron-black border-iron-gray">
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="hiit">HIIT</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty" className="text-iron-gray">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-iron-black border-iron-gray text-iron-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-iron-black border-iron-gray">
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-iron-gray">Est. Duration</Label>
              <div className="flex items-center gap-2 text-iron-orange">
                <Clock className="w-4 h-4" />
                <span>{Math.round(estimatedDuration)} minutes</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-iron-gray">Description</Label>
            <Textarea
              id="description"
              value={workoutDescription}
              onChange={(e) => setWorkoutDescription(e.target.value)}
              placeholder="Describe your workout..."
              className="bg-iron-black border-iron-gray text-iron-white"
              rows={3}
            />
          </div>
        </div>

        {/* Exercises Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl text-iron-white">
              EXERCISES ({workoutExercises.length})
            </h2>
            <Button
              onClick={() => setShowExerciseLibrary(!showExerciseLibrary)}
              size="sm"
              className="bg-iron-orange text-iron-black hover:bg-orange-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </div>

          {errors.exercises && (
            <p className="text-red-500 text-sm">{errors.exercises}</p>
          )}

          {/* Exercise Library */}
          {showExerciseLibrary && (
            <div className="bg-iron-gray/10 border border-iron-gray p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-lg text-iron-white">EXERCISE LIBRARY</h3>
                <Button
                  onClick={() => setShowExerciseLibrary(false)}
                  size="sm"
                  variant="ghost"
                  className="text-iron-gray hover:text-iron-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search exercises..."
                    className="bg-iron-black border-iron-gray text-iron-white"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-iron-black border-iron-gray text-iron-white w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-iron-black border-iron-gray">
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="chest">Chest</SelectItem>
                    <SelectItem value="back">Back</SelectItem>
                    <SelectItem value="shoulders">Shoulders</SelectItem>
                    <SelectItem value="arms">Arms</SelectItem>
                    <SelectItem value="legs">Legs</SelectItem>
                    <SelectItem value="core">Core</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredExercises.map((exercise) => (
                  <div
                    key={'id' in exercise ? exercise.id : exercise.name}
                    className="flex items-center justify-between p-3 bg-iron-black border border-iron-gray hover:border-iron-orange transition-colors cursor-pointer"
                    onClick={() => addExerciseToWorkout(exercise)}
                  >
                    <div>
                      <p className="text-iron-white font-medium">{exercise.name}</p>
                      <div className="flex items-center gap-2 text-iron-gray text-sm">
                        <span>{exercise.category}</span>
                        {'muscle_group' in exercise && (
                          <>
                            <span>•</span>
                            <span>{exercise.muscle_group}</span>
                          </>
                        )}
                        {exercise.equipment && (
                          <>
                            <span>•</span>
                            <span>{exercise.equipment}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-iron-orange" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workout Exercises List (Drag & Drop) */}
          <div className="space-y-2">
            {workoutExercises.map((exercise, index) => (
              <div
                key={exercise.id}
                draggable
                onDragStart={() => handleDragStart(exercise)}
                onDragEnter={() => handleDragEnter(exercise)}
                onDragEnd={handleDragEnd}
                className="bg-iron-gray/10 border border-iron-gray p-4 cursor-move hover:border-iron-orange transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <div className="mt-2 text-iron-gray">
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Exercise Number */}
                  <div className="mt-2 text-iron-orange font-heading text-xl">
                    {index + 1}
                  </div>

                  {/* Exercise Details */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-iron-white font-heading text-lg">
                        {exercise.exercise?.name ||
                          exercise.customExercise?.name ||
                          exercise.customExerciseName ||
                          'Unknown Exercise'}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => duplicateExercise(exercise)}
                          size="sm"
                          variant="ghost"
                          className="text-iron-gray hover:text-iron-white"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => setEditingExercise(exercise)}
                          size="sm"
                          variant="ghost"
                          className="text-iron-gray hover:text-iron-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => removeExercise(exercise.id)}
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Exercise Configuration */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-iron-gray text-xs">Sets</Label>
                        <Input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) => updateExercise(exercise.id, {
                            sets: parseInt(e.target.value) || 0
                          })}
                          className="bg-iron-black border-iron-gray text-iron-white h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-iron-gray text-xs">Reps</Label>
                        <Input
                          value={exercise.reps}
                          onChange={(e) => updateExercise(exercise.id, {
                            reps: e.target.value
                          })}
                          placeholder="8-12"
                          className="bg-iron-black border-iron-gray text-iron-white h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-iron-gray text-xs">Weight</Label>
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            value={exercise.weightValue || ''}
                            onChange={(e) => updateExercise(exercise.id, {
                              weightValue: parseFloat(e.target.value) || undefined
                            })}
                            className="bg-iron-black border-iron-gray text-iron-white h-8"
                          />
                          <Select
                            value={exercise.weightUnit}
                            onValueChange={(value: any) => updateExercise(exercise.id, {
                              weightUnit: value
                            })}
                          >
                            <SelectTrigger className="bg-iron-black border-iron-gray text-iron-white h-8 w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-iron-black border-iron-gray">
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="lbs">lbs</SelectItem>
                              <SelectItem value="bodyweight">BW</SelectItem>
                              <SelectItem value="%1rm">%1RM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-iron-gray text-xs">Rest (s)</Label>
                        <Input
                          type="number"
                          value={exercise.restSeconds}
                          onChange={(e) => updateExercise(exercise.id, {
                            restSeconds: parseInt(e.target.value) || 0
                          })}
                          className="bg-iron-black border-iron-gray text-iron-white h-8"
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    {exercise.notes && (
                      <p className="text-iron-gray text-sm">{exercise.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {workoutExercises.length === 0 && !showExerciseLibrary && (
              <div className="text-center py-12 text-iron-gray">
                <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No exercises added yet</p>
                <p className="text-sm mt-2">Click "Add Exercise" to get started</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}