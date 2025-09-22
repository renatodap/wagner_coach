'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Calendar,
  Clock,
  Heart,
  MapPin,
  Cloud,
  Thermometer,
  Camera,
  Link,
  Activity,
  Battery,
  Frown,
  Meh,
  Smile,
  Save,
  X
} from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Workout {
  id: string | number;
  name: string;
  type: string;
}

interface ManualActivityFormProps {
  userId: string;
  customWorkouts: Workout[];
  standardWorkouts: Workout[];
}

export default function ManualActivityForm({
  userId,
  customWorkouts,
  standardWorkouts
}: ManualActivityFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Basic activity info
  const [name, setName] = useState('');
  const [type, setType] = useState('strength');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(45);

  // Performance metrics
  const [distance, setDistance] = useState<number | undefined>();
  const [elevationGain, setElevationGain] = useState<number | undefined>();
  const [calories, setCalories] = useState<number | undefined>();
  const [avgHeartRate, setAvgHeartRate] = useState<number | undefined>();
  const [maxHeartRate, setMaxHeartRate] = useState<number | undefined>();

  // Subjective metrics
  const [rpe, setRpe] = useState<number>(5);
  const [mood, setMood] = useState<string>('good');
  const [energyLevel, setEnergyLevel] = useState<number>(3);
  const [sorenessLevel, setSorenessLevel] = useState<number>(0);

  // Environmental data
  const [indoor, setIndoor] = useState(true);
  const [weather, setWeather] = useState<string>('');
  const [temperature, setTemperature] = useState<number | undefined>();
  const [location, setLocation] = useState('');

  // Notes and linking
  const [notes, setNotes] = useState('');
  const [linkedWorkoutId, setLinkedWorkoutId] = useState<string>('');
  const [linkedWorkoutType, setLinkedWorkoutType] = useState<'custom' | 'standard' | ''>('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Activity name is required';
    }

    if (durationHours === 0 && durationMinutes === 0) {
      newErrors.duration = 'Duration must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Calculate duration in seconds
      const durationSeconds = (durationHours * 3600) + (durationMinutes * 60);

      // Combine date and time
      const startDateTime = new Date(`${startDate}T${startTime}`);

      // Save manual activity
      const { data: activity, error: activityError } = await supabase
        .from('manual_activities')
        .insert({
          user_id: userId,
          name,
          type,
          start_time: startDateTime.toISOString(),
          duration_seconds: durationSeconds,
          distance_meters: distance ? distance * 1000 : null, // Convert km to meters
          elevation_gain_meters: elevationGain,
          calories,
          average_heart_rate: avgHeartRate,
          max_heart_rate: maxHeartRate,
          rpe,
          mood,
          energy_level: energyLevel,
          soreness_level: sorenessLevel,
          weather_conditions: weather || null,
          temperature_celsius: temperature,
          location: location || null,
          indoor,
          notes: notes || null
        })
        .select()
        .single();

      if (activityError) throw activityError;

      // If workout is linked, create the link
      if (linkedWorkoutId && linkedWorkoutType) {
        const linkData: any = {
          user_id: userId,
          activity_source: 'manual',
          manual_activity_id: activity.id,
          link_type: 'manual'
        };

        if (linkedWorkoutType === 'custom') {
          linkData.custom_workout_id = linkedWorkoutId;
        } else {
          linkData.standard_workout_id = parseInt(linkedWorkoutId);
        }

        const { error: linkError } = await supabase
          .from('activity_workout_links')
          .insert(linkData);

        if (linkError) throw linkError;
      }

      router.push('/activities');
    } catch (error) {
      console.error('Error saving activity:', error);
      setErrors({ save: 'Failed to save activity' });
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
            <h1 className="font-heading text-2xl text-iron-orange">ADD MANUAL ACTIVITY</h1>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.back()}
                variant="ghost"
                size="sm"
                className="text-iron-gray hover:text-iron-white"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving}
                size="sm"
                className="bg-iron-orange text-iron-black hover:bg-orange-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Activity'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="basics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-iron-gray/20">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="subjective">Subjective</TabsTrigger>
            <TabsTrigger value="environment">Environment</TabsTrigger>
          </TabsList>

          {/* Basics Tab */}
          <TabsContent value="basics" className="space-y-4">
            <div className="bg-iron-gray/10 border border-iron-gray p-6 space-y-4">
              <h2 className="font-heading text-lg text-iron-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-iron-orange" />
                BASIC INFORMATION
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-iron-gray">Activity Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Morning Workout"
                    className="bg-iron-black border-iron-gray text-iron-white"
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-iron-gray">Activity Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-iron-black border-iron-gray text-iron-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-iron-black border-iron-gray">
                      <SelectItem value="strength">Strength Training</SelectItem>
                      <SelectItem value="run">Run</SelectItem>
                      <SelectItem value="ride">Bike Ride</SelectItem>
                      <SelectItem value="swim">Swim</SelectItem>
                      <SelectItem value="walk">Walk</SelectItem>
                      <SelectItem value="hike">Hike</SelectItem>
                      <SelectItem value="yoga">Yoga</SelectItem>
                      <SelectItem value="crossfit">CrossFit</SelectItem>
                      <SelectItem value="sports">Sports</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-iron-gray">Date & Time</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-iron-black border-iron-gray text-iron-white"
                    />
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="bg-iron-black border-iron-gray text-iron-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-iron-gray">Duration *</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={durationHours}
                        onChange={(e) => setDurationHours(parseInt(e.target.value) || 0)}
                        min="0"
                        className="bg-iron-black border-iron-gray text-iron-white w-20"
                      />
                      <span className="text-iron-gray text-sm">hrs</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                        min="0"
                        max="59"
                        className="bg-iron-black border-iron-gray text-iron-white w-20"
                      />
                      <span className="text-iron-gray text-sm">min</span>
                    </div>
                  </div>
                  {errors.duration && <p className="text-red-500 text-sm">{errors.duration}</p>}
                </div>
              </div>

              {/* Workout Linking */}
              <div className="space-y-2 pt-4 border-t border-iron-gray">
                <Label className="text-iron-gray flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  Link to Workout (Optional)
                </Label>
                <Select
                  value={linkedWorkoutId}
                  onValueChange={(value) => {
                    setLinkedWorkoutId(value);
                    const isCustom = customWorkouts.some(w => w.id === value);
                    setLinkedWorkoutType(isCustom ? 'custom' : 'standard');
                  }}
                >
                  <SelectTrigger className="bg-iron-black border-iron-gray text-iron-white">
                    <SelectValue placeholder="Select a workout to link..." />
                  </SelectTrigger>
                  <SelectContent className="bg-iron-black border-iron-gray">
                    <SelectItem value="">No workout</SelectItem>
                    {customWorkouts.length > 0 && (
                      <>
                        <SelectItem value="custom-header" disabled>
                          <span className="text-iron-orange">— Your Workouts —</span>
                        </SelectItem>
                        {customWorkouts.map((workout) => (
                          <SelectItem key={workout.id} value={workout.id.toString()}>
                            {workout.name}
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
                            {workout.name}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="bg-iron-gray/10 border border-iron-gray p-6 space-y-4">
              <h2 className="font-heading text-lg text-iron-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-iron-orange" />
                PERFORMANCE METRICS
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-iron-gray">Distance (km)</Label>
                  <Input
                    type="number"
                    value={distance || ''}
                    onChange={(e) => setDistance(parseFloat(e.target.value) || undefined)}
                    step="0.1"
                    className="bg-iron-black border-iron-gray text-iron-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-iron-gray">Elevation Gain (m)</Label>
                  <Input
                    type="number"
                    value={elevationGain || ''}
                    onChange={(e) => setElevationGain(parseInt(e.target.value) || undefined)}
                    className="bg-iron-black border-iron-gray text-iron-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-iron-gray">Calories Burned</Label>
                  <Input
                    type="number"
                    value={calories || ''}
                    onChange={(e) => setCalories(parseInt(e.target.value) || undefined)}
                    className="bg-iron-black border-iron-gray text-iron-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-iron-gray">Average Heart Rate</Label>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-iron-orange" />
                    <Input
                      type="number"
                      value={avgHeartRate || ''}
                      onChange={(e) => setAvgHeartRate(parseInt(e.target.value) || undefined)}
                      className="bg-iron-black border-iron-gray text-iron-white"
                    />
                    <span className="text-iron-gray text-sm">bpm</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-iron-gray">Max Heart Rate</Label>
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-500" />
                    <Input
                      type="number"
                      value={maxHeartRate || ''}
                      onChange={(e) => setMaxHeartRate(parseInt(e.target.value) || undefined)}
                      className="bg-iron-black border-iron-gray text-iron-white"
                    />
                    <span className="text-iron-gray text-sm">bpm</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Subjective Tab */}
          <TabsContent value="subjective" className="space-y-4">
            <div className="bg-iron-gray/10 border border-iron-gray p-6 space-y-4">
              <h2 className="font-heading text-lg text-iron-white">SUBJECTIVE METRICS</h2>

              <div className="space-y-4">
                {/* RPE */}
                <div className="space-y-2">
                  <Label className="text-iron-gray">Rate of Perceived Exertion (RPE)</Label>
                  <div className="flex items-center gap-4">
                    <span className="text-iron-gray">Easy</span>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={rpe}
                      onChange={(e) => setRpe(parseInt(e.target.value))}
                      className="flex-1 accent-iron-orange"
                    />
                    <span className="text-iron-gray">Max</span>
                    <span className="text-iron-orange font-heading text-xl w-8">{rpe}</span>
                  </div>
                </div>

                {/* Mood */}
                <div className="space-y-2">
                  <Label className="text-iron-gray">Mood</Label>
                  <div className="flex gap-2">
                    {[
                      { value: 'terrible', icon: Frown, label: 'Terrible' },
                      { value: 'bad', icon: Frown, label: 'Bad' },
                      { value: 'okay', icon: Meh, label: 'Okay' },
                      { value: 'good', icon: Smile, label: 'Good' },
                      { value: 'amazing', icon: Smile, label: 'Amazing' }
                    ].map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setMood(option.value)}
                          className={`flex-1 p-3 border ${
                            mood === option.value
                              ? 'border-iron-orange bg-iron-orange/20'
                              : 'border-iron-gray'
                          } hover:border-iron-orange transition-colors`}
                        >
                          <Icon className="w-5 h-5 mx-auto mb-1" />
                          <p className="text-xs">{option.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Energy Level */}
                <div className="space-y-2">
                  <Label className="text-iron-gray flex items-center gap-2">
                    <Battery className="w-4 h-4" />
                    Energy Level
                  </Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        onClick={() => setEnergyLevel(level)}
                        className={`flex-1 py-2 border ${
                          energyLevel >= level
                            ? 'bg-iron-orange border-iron-orange'
                            : 'border-iron-gray'
                        } hover:border-iron-orange transition-colors`}
                      />
                    ))}
                  </div>
                </div>

                {/* Soreness */}
                <div className="space-y-2">
                  <Label className="text-iron-gray">Muscle Soreness</Label>
                  <div className="flex items-center gap-4">
                    <span className="text-iron-gray">None</span>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={sorenessLevel}
                      onChange={(e) => setSorenessLevel(parseInt(e.target.value))}
                      className="flex-1 accent-iron-orange"
                    />
                    <span className="text-iron-gray">Severe</span>
                    <span className="text-iron-orange font-heading text-xl w-8">{sorenessLevel}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Environment Tab */}
          <TabsContent value="environment" className="space-y-4">
            <div className="bg-iron-gray/10 border border-iron-gray p-6 space-y-4">
              <h2 className="font-heading text-lg text-iron-white">ENVIRONMENTAL CONDITIONS</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="indoor"
                      checked={indoor}
                      onCheckedChange={(checked) => setIndoor(checked as boolean)}
                    />
                    <Label htmlFor="indoor" className="text-iron-gray">Indoor Activity</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-iron-gray flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Home Gym, Central Park"
                    className="bg-iron-black border-iron-gray text-iron-white"
                  />
                </div>

                {!indoor && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-iron-gray flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        Weather Conditions
                      </Label>
                      <Select value={weather} onValueChange={setWeather}>
                        <SelectTrigger className="bg-iron-black border-iron-gray text-iron-white">
                          <SelectValue placeholder="Select weather..." />
                        </SelectTrigger>
                        <SelectContent className="bg-iron-black border-iron-gray">
                          <SelectItem value="sunny">Sunny</SelectItem>
                          <SelectItem value="partly_cloudy">Partly Cloudy</SelectItem>
                          <SelectItem value="cloudy">Cloudy</SelectItem>
                          <SelectItem value="rainy">Rainy</SelectItem>
                          <SelectItem value="snowy">Snowy</SelectItem>
                          <SelectItem value="windy">Windy</SelectItem>
                          <SelectItem value="foggy">Foggy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-iron-gray flex items-center gap-2">
                        <Thermometer className="w-4 h-4" />
                        Temperature (°C)
                      </Label>
                      <Input
                        type="number"
                        value={temperature || ''}
                        onChange={(e) => setTemperature(parseFloat(e.target.value) || undefined)}
                        className="bg-iron-black border-iron-gray text-iron-white"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-iron-gray">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about your activity..."
                  className="bg-iron-black border-iron-gray text-iron-white"
                  rows={4}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {errors.save && (
          <div className="bg-red-500/10 border border-red-500 p-4 text-red-500">
            {errors.save}
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}