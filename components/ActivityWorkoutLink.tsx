'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Link,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ActivityWorkoutLinkProps {
  activityId: string;
  activitySource: 'strava' | 'garmin' | 'manual';
  activityData?: any;
  isOpen: boolean;
  onClose: () => void;
  onLink?: () => void;
}

export default function ActivityWorkoutLink({
  activityId,
  activitySource,
  activityData,
  isOpen,
  onClose,
  onLink
}: ActivityWorkoutLinkProps) {
  const supabase = createClient();

  const [customWorkouts, setCustomWorkouts] = useState<any[]>([]);
  const [standardWorkouts, setStandardWorkouts] = useState<any[]>([]);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('');
  const [workoutType, setWorkoutType] = useState<'custom' | 'standard' | ''>('');
  const [deviationNotes, setDeviationNotes] = useState('');
  const [linking, setLinking] = useState(false);
  const [existingLink, setExistingLink] = useState<any>(null);
  const [workoutDetails, setWorkoutDetails] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWorkouts();
      checkExistingLink();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedWorkoutId && workoutType) {
      fetchWorkoutDetails();
    }
  }, [selectedWorkoutId, workoutType]);

  const fetchWorkouts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch custom workouts
    const { data: custom } = await supabase
      .from('user_custom_workouts')
      .select('id, name, type, estimated_duration_minutes')
      .eq('user_id', user.id)
      .order('name');

    // Fetch standard workouts
    const { data: standard } = await supabase
      .from('workouts')
      .select('id, name, type, duration_minutes')
      .order('name');

    setCustomWorkouts(custom || []);
    setStandardWorkouts(standard || []);
  };

  const checkExistingLink = async () => {
    const query = supabase
      .from('activity_workout_links')
      .select(`
        *,
        custom_workout:user_custom_workouts(name, type),
        standard_workout:workouts(name, type)
      `);

    if (activitySource === 'manual') {
      query.eq('manual_activity_id', activityId);
    } else {
      query.eq('activity_source', activitySource)
        .eq('activity_source_id', activityId);
    }

    const { data } = await query.single();

    if (data) {
      setExistingLink(data);
      if (data.custom_workout_id) {
        setSelectedWorkoutId(data.custom_workout_id);
        setWorkoutType('custom');
      } else if (data.standard_workout_id) {
        setSelectedWorkoutId(data.standard_workout_id.toString());
        setWorkoutType('standard');
      }
    }
  };

  const fetchWorkoutDetails = async () => {
    let data;

    if (workoutType === 'custom') {
      const { data: workout } = await supabase
        .from('user_custom_workouts')
        .select(`
          *,
          exercises:user_workout_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('id', selectedWorkoutId)
        .single();

      data = workout;
    } else {
      const { data: workout } = await supabase
        .from('workouts')
        .select(`
          *,
          exercises:workout_exercises(
            *,
            exercise:exercises(*)
          )
        `)
        .eq('id', selectedWorkoutId)
        .single();

      data = workout;
    }

    setWorkoutDetails(data);

    // Calculate comparison if activity data exists
    if (data && activityData) {
      calculateComparison(data);
    }
  };

  const calculateComparison = (workout: any) => {
    if (!activityData || !workout) return;

    const plannedDuration = workout.estimated_duration_minutes || workout.duration_minutes || 0;
    const actualDuration = activityData.duration_seconds ? activityData.duration_seconds / 60 : 0;

    const comp = {
      plannedDuration,
      actualDuration,
      durationDiff: actualDuration - plannedDuration,
      durationPercentage: plannedDuration > 0 ? (actualDuration / plannedDuration) * 100 : 0,
      plannedExercises: workout.exercises?.length || 0,
      completedExercises: 0, // Would need exercise-level tracking
      completionRate: 0
    };

    // Rough completion rate estimate based on duration
    if (comp.durationPercentage >= 80) {
      comp.completionRate = Math.min(100, comp.durationPercentage);
    } else {
      comp.completionRate = comp.durationPercentage;
    }

    setComparison(comp);
  };

  const handleLink = async () => {
    if (!selectedWorkoutId || !workoutType) return;

    setLinking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const linkData: any = {
        user_id: user.id,
        activity_source: activitySource,
        link_type: 'manual',
        deviation_notes: deviationNotes || null
      };

      if (activitySource === 'manual') {
        linkData.manual_activity_id = activityId;
      } else {
        linkData.activity_source_id = activityId;
      }

      if (workoutType === 'custom') {
        linkData.custom_workout_id = selectedWorkoutId;
      } else {
        linkData.standard_workout_id = parseInt(selectedWorkoutId);
      }

      // Calculate completion percentage if we have comparison
      if (comparison) {
        linkData.completion_percentage = comparison.completionRate;
      }

      if (existingLink) {
        // Update existing link
        const { error } = await supabase
          .from('activity_workout_links')
          .update(linkData)
          .eq('id', existingLink.id);

        if (error) throw error;
      } else {
        // Create new link
        const { error } = await supabase
          .from('activity_workout_links')
          .insert(linkData);

        if (error) throw error;
      }

      onLink?.();
      onClose();
    } catch (error) {
      console.error('Error linking activity:', error);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async () => {
    if (!existingLink) return;

    setLinking(true);
    try {
      const { error } = await supabase
        .from('activity_workout_links')
        .delete()
        .eq('id', existingLink.id);

      if (error) throw error;

      setExistingLink(null);
      setSelectedWorkoutId('');
      setWorkoutType('');
      onLink?.();
    } catch (error) {
      console.error('Error unlinking activity:', error);
    } finally {
      setLinking(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-iron-black text-iron-white border-iron-gray">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl text-iron-orange">
            {existingLink ? 'UPDATE WORKOUT LINK' : 'LINK TO WORKOUT'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Workout Selection */}
          <div className="space-y-2">
            <Label className="text-iron-gray">Select Workout</Label>
            <Select
              value={selectedWorkoutId}
              onValueChange={(value) => {
                setSelectedWorkoutId(value);
                const isCustom = customWorkouts.some(w => w.id === value);
                setWorkoutType(isCustom ? 'custom' : 'standard');
              }}
            >
              <SelectTrigger className="bg-iron-black border-iron-gray text-iron-white">
                <SelectValue placeholder="Choose a workout..." />
              </SelectTrigger>
              <SelectContent className="bg-iron-black border-iron-gray">
                {customWorkouts.length > 0 && (
                  <>
                    <SelectItem value="custom-header" disabled>
                      <span className="text-iron-orange">— Your Workouts —</span>
                    </SelectItem>
                    {customWorkouts.map((workout) => (
                      <SelectItem key={workout.id} value={workout.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{workout.name}</span>
                          <span className="text-iron-gray text-xs ml-2">
                            {workout.estimated_duration_minutes}min
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
                {standardWorkouts.length > 0 && (
                  <>
                    <SelectItem value="standard-header" disabled>
                      <span className="text-iron-orange">— Standard Workouts —</span>
                    </SelectItem>
                    {standardWorkouts.map((workout) => (
                      <SelectItem key={workout.id} value={workout.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <span>{workout.name}</span>
                          <span className="text-iron-gray text-xs ml-2">
                            {workout.duration_minutes}min
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Comparison View */}
          {comparison && workoutDetails && (
            <div className="bg-iron-gray/10 border border-iron-gray p-4 space-y-3">
              <h3 className="font-heading text-iron-white flex items-center gap-2">
                <Target className="w-4 h-4 text-iron-orange" />
                PLANNED VS ACTUAL
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-iron-gray text-sm">Planned Duration</p>
                  <p className="text-xl font-heading text-iron-white">
                    {comparison.plannedDuration} min
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-iron-gray text-sm">Actual Duration</p>
                  <p className="text-xl font-heading text-iron-white">
                    {Math.round(comparison.actualDuration)} min
                  </p>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-iron-gray text-sm">Completion Rate</p>
                  <p className="text-iron-orange font-heading">
                    {Math.round(comparison.completionRate)}%
                  </p>
                </div>
                <div className="w-full bg-iron-gray/30 h-2">
                  <div
                    className="h-full bg-iron-orange transition-all"
                    style={{ width: `${Math.min(100, comparison.completionRate)}%` }}
                  />
                </div>
              </div>

              {/* Duration Difference */}
              {comparison.durationDiff !== 0 && (
                <div className="flex items-center gap-2 text-sm">
                  {comparison.durationDiff > 0 ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-green-500">
                        +{Math.round(Math.abs(comparison.durationDiff))} min longer than planned
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-yellow-500" />
                      <span className="text-yellow-500">
                        {Math.round(Math.abs(comparison.durationDiff))} min shorter than planned
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Deviation Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-iron-gray">
              Notes (Why was the workout modified?)
            </Label>
            <Textarea
              id="notes"
              value={deviationNotes}
              onChange={(e) => setDeviationNotes(e.target.value)}
              placeholder="e.g., Cut short due to time, Added extra sets, etc."
              className="bg-iron-black border-iron-gray text-iron-white"
              rows={3}
            />
          </div>

          {/* Existing Link Info */}
          {existingLink && (
            <div className="bg-iron-orange/10 border border-iron-orange p-3 text-sm">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                This activity is currently linked to:
                <strong>
                  {existingLink.custom_workout?.name || existingLink.standard_workout?.name}
                </strong>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {existingLink ? (
            <>
              <Button
                onClick={handleUnlink}
                variant="ghost"
                className="text-red-500 hover:text-red-400"
                disabled={linking}
              >
                Unlink
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="ghost"
                  className="text-iron-gray hover:text-iron-white"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLink}
                  className="bg-iron-orange text-iron-black hover:bg-orange-600"
                  disabled={linking || !selectedWorkoutId}
                >
                  {linking ? 'Updating...' : 'Update Link'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-iron-gray hover:text-iron-white"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLink}
                className="bg-iron-orange text-iron-black hover:bg-orange-600"
                disabled={linking || !selectedWorkoutId}
              >
                <Link className="w-4 h-4 mr-2" />
                {linking ? 'Linking...' : 'Link Workout'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}