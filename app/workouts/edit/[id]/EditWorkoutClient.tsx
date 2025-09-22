'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Workout } from '@/lib/types/workout-types';
import { Exercise } from '@/lib/types/exercise-types';
import { WorkoutExercise } from '@/lib/types/workout-exercise-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Trash2, PlusCircle, Search } from 'lucide-react';

interface EditWorkoutClientProps {
  workout: Workout;
  initialWorkoutExercises: WorkoutExercise[];
  allExercises: Exercise[];
  userId: string;
}

export default function EditWorkoutClient({
  workout,
  initialWorkoutExercises,
  allExercises,
  userId
}: EditWorkoutClientProps) {
  const router = useRouter();
  const supabase = createClient();

  // Workout details state
  const [name, setName] = useState(workout.name);
  const [description, setDescription] = useState(workout.description || '');
  const [type, setType] = useState(workout.type);
  const [difficulty, setDifficulty] = useState(workout.difficulty);
  const [isPublic, setIsPublic] = useState(workout.is_public);

  // Exercises state
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>(initialWorkoutExercises);

  // Add exercise state
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddExerciseModalOpen, setAddExerciseModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  // New exercise details state
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState('8-12');
  const [rest, setRest] = useState(60);

  // Generic loading/error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredExercises = useMemo(() => {
    if (!searchTerm) return [];
    return allExercises.filter(ex =>
      ex.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !workoutExercises.some(we => we.exercise_id === ex.id) // Don't show exercises already in the workout
    );
  }, [searchTerm, allExercises, workoutExercises]);

  const handleAddExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setAddExerciseModalOpen(true);
  };

  const handleConfirmAddExercise = () => {
    if (!selectedExercise) return;

    const newWorkoutExercise: WorkoutExercise = {
      id: -1, // Temporary ID
      workout_id: workout.id,
      exercise_id: selectedExercise.id,
      sets,
      reps,
      rest_seconds: rest,
      order_index: workoutExercises.length,
      notes: '',
      exercises: selectedExercise
    };

    setWorkoutExercises([...workoutExercises, newWorkoutExercise]);

    // Reset and close modal
    setAddExerciseModalOpen(false);
    setSelectedExercise(null);
    setSearchTerm('');
    setSets(3);
    setReps('8-12');
    setRest(60);
  };

  const handleRemoveExercise = (exerciseId: number) => {
    setWorkoutExercises(workoutExercises.filter(we => we.exercise_id !== exerciseId));
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);

    // 1. Update workout details
    const { error: workoutUpdateError } = await supabase
      .from('workouts')
      .update({ name, description, type, difficulty, is_public })
      .eq('id', workout.id);

    if (workoutUpdateError) {
      setError(`Error updating workout details: ${workoutUpdateError.message}`);
      setLoading(false);
      return;
    }

    // 2. Delete all existing workout_exercises for this workout
    const { error: deleteError } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('workout_id', workout.id);

    if (deleteError) {
        setError(`Error clearing old exercises: ${deleteError.message}`);
        setLoading(false);
        return;
    }

    // 3. Insert the new list of workout_exercises
    const newExercisesToInsert = workoutExercises.map((we, index) => ({
        workout_id: workout.id,
        exercise_id: we.exercise_id,
        sets: we.sets,
        reps: we.reps,
        rest_seconds: we.rest_seconds,
        order_index: index,
        notes: we.notes
    }));

    if (newExercisesToInsert.length > 0) {
        const { error: insertError } = await supabase
            .from('workout_exercises')
            .insert(newExercisesToInsert);

        if (insertError) {
            setError(`Error saving new exercises: ${insertError.message}`);
            setLoading(false);
            return;
        }
    }

    setLoading(false);
    router.push('/workouts');
    router.refresh(); // Refresh server-side props on the workouts page
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-heading text-3xl text-iron-orange mb-2">Edit Workout</h1>
        <p className="text-iron-gray mb-6">Modify details and manage the exercises for this workout.</p>

        {/* Workout Details Form */}
        <div className="bg-iron-gray/10 p-6 space-y-6 mb-8">
           <div className="space-y-2">
                <Label htmlFor="name" className="text-iron-gray">Workout Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-iron-gray/20 border-iron-gray"/>
            </div>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description..." className="bg-iron-gray/20 border-iron-gray"/>
            {/* Other fields like type, difficulty, is_public */}
        </div>

        {/* Exercise List */}
        <div className="space-y-4 mb-8">
            <h2 className="font-heading text-2xl text-iron-white">Exercises</h2>
            {workoutExercises.map((we) => (
                <div key={we.exercise_id} className="flex items-center justify-between bg-iron-gray/10 p-4">
                    <div>
                        <p className="text-iron-white font-bold">{we.exercises?.name}</p>
                        <p className="text-iron-gray text-sm">{we.sets} sets x {we.reps} reps, {we.rest_seconds}s rest</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveExercise(we.exercise_id)}>
                        <Trash2 className="w-5 h-5 text-red-500"/>
                    </Button>
                </div>
            ))}
             {workoutExercises.length === 0 && <p className="text-iron-gray">No exercises yet. Add some below.</p>}
        </div>

        {/* Add Exercise Section */}
        <div className="bg-iron-gray/10 p-6 space-y-4">
            <h3 className="font-heading text-xl text-iron-white">Add an Exercise</h3>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-iron-gray" />
                <Input placeholder="Search for an exercise..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-iron-gray/20 border-iron-gray"/>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
                {filteredExercises.map(ex => (
                    <div key={ex.id} className="flex items-center justify-between p-3 hover:bg-iron-gray/20">
                        <p>{ex.name}</p>
                        <Button size="sm" variant="ghost" onClick={() => handleAddExercise(ex)}>
                            <PlusCircle className="w-5 h-5 text-iron-orange"/>
                        </Button>
                    </div>
                ))}
            </div>
        </div>

        {/* Save/Cancel Buttons */}
        <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-iron-gray">
            <Button variant="outline" onClick={() => router.push('/workouts')}>Cancel</Button>
            <Button onClick={handleSaveChanges} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>

      {/* Add Exercise Details Modal */}
      <Dialog open={isAddExerciseModalOpen} onOpenChange={setAddExerciseModalOpen}>
        <DialogContent className="bg-iron-black border-iron-orange">
          <DialogHeader>
            <DialogTitle className="text-iron-orange">Add {selectedExercise?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Sets</Label>
                <Input type="number" value={sets} onChange={e => setSets(parseInt(e.target.value, 10))} className="bg-iron-gray/20 border-iron-gray"/>
            </div>
            <div className="space-y-2">
                <Label>Reps (e.g., 8-12 or 15)</Label>
                <Input value={reps} onChange={e => setReps(e.target.value)} className="bg-iron-gray/20 border-iron-gray"/>
            </div>
            <div className="space-y-2">
                <Label>Rest (seconds)</Label>
                <Input type="number" value={rest} onChange={e => setRest(parseInt(e.target.value, 10))} className="bg-iron-gray/20 border-iron-gray"/>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddExerciseModalOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAddExercise}>Add to Workout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
