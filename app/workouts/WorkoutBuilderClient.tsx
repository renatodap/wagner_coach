'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Define types for exercises
interface Exercise {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  source: 'global' | 'user';
}

interface WorkoutExercise extends Exercise {
  instanceId: string; // Unique ID for each instance of an exercise in the workout
  source: 'global' | 'user';
  sets: number;
  reps: string;
  rest: number;
}

interface WorkoutBuilderClientProps {
  userId: string;
  globalExercises: Exercise[];
  userExercises: Exercise[];
  initialWorkout?: any; // A bit of a shortcut for now
}

// SortableItem component for drag and drop
function SortableItem({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (process.env.NODE_ENV === 'test') {
    return <div>{children}</div>;
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function WorkoutBuilderClient({ userId, globalExercises, userExercises, initialWorkout }: WorkoutBuilderClientProps) {
  const router = useRouter();
  const isEditMode = !!initialWorkout;

  const [workoutName, setWorkoutName] = useState(initialWorkout?.name || '');
  const [workoutDescription, setWorkoutDescription] = useState(initialWorkout?.description || '');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(initialWorkout?.difficulty || 'intermediate');
  const [workoutType, setWorkoutType] = useState(initialWorkout?.type || '');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>(initialWorkout?.exercises || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isCreateExerciseModalOpen, setIsCreateExerciseModalOpen] = useState(false);
  const [newExercise, setNewExercise] = useState({ name: '', category: '', muscle_group: '' });

  const allExercises = [...globalExercises, ...userExercises];

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSelectedExercises((items) => {
        const oldIndex = items.findIndex((item) => item.instanceId === active.id);
        const newIndex = items.findIndex((item) => item.instanceId === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    const newExerciseInstance: WorkoutExercise = {
      ...exercise,
      instanceId: `${exercise.id}-${Date.now()}`, // Simple unique ID
      sets: 3,
      reps: '10-12',
      rest: 60,
    };
    setSelectedExercises([...selectedExercises, newExerciseInstance]);
  };

  const removeExerciseFromWorkout = (instanceId: string) => {
    setSelectedExercises(selectedExercises.filter((ex) => ex.instanceId !== instanceId));
  };

  const updateExercise = (instanceId: string, field: keyof WorkoutExercise, value: any) => {
    setSelectedExercises(selectedExercises.map(ex =>
      ex.instanceId === instanceId ? { ...ex, [field]: value } : ex
    ));
  };

  const handleSaveWorkout = async () => {
    if (isEditMode) {
      // Update existing workout
      const workoutResponse = await fetch(`/api/workouts/${initialWorkout.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workoutName,
          description: workoutDescription,
          difficulty,
          type: workoutType,
          exercises: selectedExercises,
        }),
      });

      if (!workoutResponse.ok) {
        console.error('Failed to update workout');
        // TODO: Show error to user
        return;
      }

      router.push('/workouts');

    } else {
      // Create new workout
      const workoutResponse = await fetch('/api/workouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: workoutName,
          description: workoutDescription,
          difficulty,
          type: workoutType,
        }),
      });

      if (!workoutResponse.ok) {
        console.error('Failed to create workout');
        // TODO: Show error to user
        return;
      }

      const newWorkout = await workoutResponse.json();

      // Step 2: Save the exercises
      const exercisesResponse = await fetch('/api/workouts/save-exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workout_id: newWorkout.id,
          exercises: selectedExercises,
        }),
      });

      if (!exercisesResponse.ok) {
        console.error('Failed to save exercises');
        // TODO: Show error to user
        // TODO: Maybe delete the created workout?
        return;
      }

      // Step 3: Redirect to the workouts page
      router.push('/workouts');
    }
  };

  const handleCreateExercise = async () => {
    const response = await fetch('/api/user-exercises', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newExercise),
    });

    if (response.ok) {
      const createdExercise = await response.json();
      // Add to local list of exercises and close modal
      allExercises.push(createdExercise);
      setIsCreateExerciseModalOpen(false);
      setNewExercise({ name: '', category: '', muscle_group: '' });
    } else {
      // Handle error
      console.error('Failed to create exercise');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {isEditMode ? 'Edit Custom Workout' : 'Create Custom Workout'}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left side: Workout details and selected exercises */}
        <div>
          <div className="mb-4">
            <label htmlFor="workout-name" className="block text-sm font-medium text-gray-700">Workout Name</label>
            <input
              type="text"
              id="workout-name"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="workout-description" className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              id="workout-description"
              value={workoutDescription}
              onChange={(e) => setWorkoutDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">Difficulty</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option>beginner</option>
                <option>intermediate</option>
                <option>advanced</option>
              </select>
            </div>
            <div>
              <label htmlFor="workout-type" className="block text-sm font-medium text-gray-700">Type</label>
              <input
                type="text"
                id="workout-type"
                value={workoutType}
                onChange={(e) => setWorkoutType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <h2 className="text-xl font-bold mb-2">Selected Exercises</h2>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={selectedExercises.map(ex => ex.instanceId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2" data-testid="selected-exercises">
                {selectedExercises.map((exercise) => (
                  <SortableItem key={exercise.instanceId} id={exercise.instanceId}>
                    <div className="p-4 border rounded-md bg-white shadow">
                      <h3 className="font-bold">{exercise.name}</h3>
                      <p className="text-sm text-gray-500">{exercise.muscle_group}</p>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <label className="text-xs">Sets</label>
                          <input type="number" value={exercise.sets} onChange={(e) => updateExercise(exercise.instanceId, 'sets', parseInt(e.target.value))} className="w-full border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="text-xs">Reps</label>
                          <input type="text" value={exercise.reps} onChange={(e) => updateExercise(exercise.instanceId, 'reps', e.target.value)} className="w-full border-gray-300 rounded-md" />
                        </div>
                        <div>
                          <label className="text-xs">Rest (s)</label>
                          <input type="number" value={exercise.rest} onChange={(e) => updateExercise(exercise.instanceId, 'rest', parseInt(e.target.value))} className="w-full border-gray-300 rounded-md" />
                        </div>
                      </div>
                      <button onClick={() => removeExerciseFromWorkout(exercise.instanceId)} className="text-red-500 text-sm mt-2">Remove</button>
                    </div>
                  </SortableItem>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Right side: Exercise library */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold">Exercise Library</h2>
            <button onClick={() => setIsCreateExerciseModalOpen(true)} className="bg-purple-500 text-white px-2 py-1 rounded">Create New</button>
          </div>
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-2 p-2 border rounded-md"
          />
          <div className="grid grid-cols-2 gap-2 mb-4">
            <select value={muscleGroupFilter} onChange={(e) => setMuscleGroupFilter(e.target.value)} className="w-full p-2 border rounded-md">
              <option value="">All Muscle Groups</option>
              {[...new Set(allExercises.map(ex => ex.muscle_group))].map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full p-2 border rounded-md">
              <option value="">All Categories</option>
              {[...new Set(allExercises.map(ex => ex.category))].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto" data-testid="exercise-library">
            {allExercises
              .filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .filter(ex => muscleGroupFilter ? ex.muscle_group === muscleGroupFilter : true)
              .filter(ex => categoryFilter ? ex.category === categoryFilter : true)
              .map(exercise => (
                <div key={exercise.id} className="p-4 border rounded-md bg-white shadow flex justify-between items-center">
                  <div>
                    <h3 className="font-bold">{exercise.name}</h3>
                    <p className="text-sm text-gray-500">{exercise.muscle_group}</p>
                  </div>
                  <button onClick={() => addExerciseToWorkout(exercise)} className="bg-blue-500 text-white px-2 py-1 rounded">Add</button>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleSaveWorkout} className="bg-green-500 text-white px-4 py-2 rounded">Save Workout</button>
      </div>

      {isCreateExerciseModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Create New Exercise</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Exercise Name"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Category"
                value={newExercise.category}
                onChange={(e) => setNewExercise({ ...newExercise, category: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
              <input
                type="text"
                placeholder="Muscle Group"
                value={newExercise.muscle_group}
                onChange={(e) => setNewExercise({ ...newExercise, muscle_group: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div className="mt-4 flex justify-end gap-4">
              <button onClick={() => setIsCreateExerciseModalOpen(false)} className="text-gray-500">Cancel</button>
              <button onClick={handleCreateExercise} className="bg-blue-500 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
