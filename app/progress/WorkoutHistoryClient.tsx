'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Trash2, Edit, Clock, Trophy, Weight, Star } from 'lucide-react';

interface WorkoutHistory {
  completion_id: number;
  workout_id: number;
  workout_name: string;
  workout_type: string;
  completed_at: string;
  duration_seconds: number;
  rating: number | null;
  notes: string | null;
  sets_performed: number;
  total_weight_lifted: number | null;
}

interface WorkoutHistoryClientProps {
  initialHistory: WorkoutHistory[];
  userId: string;
}

export default function WorkoutHistoryClient({ initialHistory, userId }: WorkoutHistoryClientProps) {
  const [history, setHistory] = useState<WorkoutHistory[]>(initialHistory);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    duration: 0,
    rating: 0,
    notes: ''
  });

  const supabase = createClient();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatWeight = (weight: number | null) => {
    if (!weight) return '-';
    return `${Math.round(weight)} lbs`;
  };

  const startEdit = (workout: WorkoutHistory) => {
    setEditingId(workout.completion_id);
    setEditForm({
      duration: workout.duration_seconds,
      rating: workout.rating || 0,
      notes: workout.notes || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ duration: 0, rating: 0, notes: '' });
  };

  const saveEdit = async (completionId: number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: success } = await (supabase as any).rpc('edit_workout_completion', {
        p_completion_id: completionId,
        p_user_id: userId,
        p_duration_seconds: editForm.duration,
        p_rating: editForm.rating || null,
        p_notes: editForm.notes || null
      });

      if (success) {
        // Update local state
        setHistory(history.map(h =>
          h.completion_id === completionId
            ? {
                ...h,
                duration_seconds: editForm.duration,
                rating: editForm.rating || null,
                notes: editForm.notes || null
              }
            : h
        ));
        setEditingId(null);
      }
    } catch (error) {
      console.error('Error editing workout:', error);
    }
  };

  const deleteWorkout = async (workout: WorkoutHistory) => {
    if (!confirm(`Delete ${workout.workout_name} from ${formatDate(workout.completed_at)}?`)) {
      return;
    }

    try {
      // Get user_workout_id first
      const { data: completion } = await supabase
        .from('workout_completions')
        .select('user_workout_id')
        .eq('id', workout.completion_id)
        .single();

      if (completion?.user_workout_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: success } = await (supabase as any).rpc('delete_workout_history', {
          p_user_id: userId,
          p_user_workout_id: completion.user_workout_id
        });

        if (success) {
          setHistory(history.filter(h => h.completion_id !== workout.completion_id));
        }
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
    }
  };

  const getRatingStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-iron-gray'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {history.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-iron-gray mx-auto mb-4" />
          <p className="text-iron-gray">No workouts completed yet</p>
          <p className="text-iron-gray text-sm">Complete your first workout to see it here!</p>
        </div>
      ) : (
        history.map((workout) => (
          <div
            key={workout.completion_id}
            className="border border-iron-gray hover:border-iron-orange transition-colors"
          >
            {editingId === workout.completion_id ? (
              // Edit Mode
              <div className="p-4 space-y-4">
                <h3 className="font-heading text-xl text-iron-orange">
                  EDIT WORKOUT
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-iron-gray text-sm block mb-1">Duration (seconds)</label>
                    <input
                      type="number"
                      value={editForm.duration}
                      onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 0 })}
                      className="w-full bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:border-iron-orange focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-iron-gray text-sm block mb-1">Rating (1-5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={editForm.rating}
                      onChange={(e) => setEditForm({ ...editForm, rating: parseInt(e.target.value) || 0 })}
                      className="w-full bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:border-iron-orange focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-iron-gray text-sm block mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full bg-iron-gray/10 border border-iron-gray px-3 py-2 text-iron-white focus:border-iron-orange focus:outline-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(workout.completion_id)}
                    className="px-4 py-2 bg-iron-orange text-iron-black hover:bg-iron-white transition-colors"
                  >
                    SAVE
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 border border-iron-gray text-iron-gray hover:border-iron-white hover:text-iron-white transition-colors"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-heading text-xl text-iron-white">
                        {workout.workout_name}
                      </h3>
                      <span className="text-iron-gray text-xs uppercase">
                        {workout.workout_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-iron-gray mb-2">
                      <span>{formatDate(workout.completed_at)}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(workout.duration_seconds)}
                      </div>
                      {workout.sets_performed > 0 && (
                        <span>{workout.sets_performed} sets</span>
                      )}
                      {workout.total_weight_lifted && (
                        <div className="flex items-center gap-1">
                          <Weight className="w-4 h-4" />
                          {formatWeight(workout.total_weight_lifted)}
                        </div>
                      )}
                    </div>

                    {workout.rating && getRatingStars(workout.rating)}

                    {workout.notes && (
                      <p className="text-iron-gray text-sm mt-2 italic">
                        &ldquo;{workout.notes}&rdquo;
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(workout)}
                      className="p-2 text-iron-gray hover:text-iron-orange transition-colors"
                      title="Edit workout"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteWorkout(workout)}
                      className="p-2 text-iron-gray hover:text-red-500 transition-colors"
                      title="Delete workout"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}