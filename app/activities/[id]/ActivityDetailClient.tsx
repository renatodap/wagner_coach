'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Clock,
  MapPin,
  Heart,
  Zap,
  TrendingUp,
  Thermometer,
  Wind,
  Droplets,
  Activity,
  Calendar,
  Gauge,
  Battery,
  Brain,
  Target,
  Award,
  BarChart3,
  Mountain,
  Waves,
  Bike,
  Footprints,
  Dumbbell
} from 'lucide-react';
import BottomNavigation from '@/app/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ActivityDetailProps {
  activity: any;
}

export default function ActivityDetailClient({ activity }: ActivityDetailProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedActivity, setEditedActivity] = useState(activity);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('activities')
        .update({
          name: editedActivity.name,
          notes: editedActivity.notes,
          perceived_exertion: editedActivity.perceived_exertion,
          mood: editedActivity.mood,
          energy_level: editedActivity.energy_level,
          workout_rating: editedActivity.workout_rating,
          updated_at: new Date().toISOString()
        })
        .eq('id', activity.id);

      if (error) throw error;

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error('Failed to save activity:', error);
      alert('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return 'N/A';
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`;
    }
    return `${Math.round(meters)} m`;
  };

  const formatPace = (speedMs?: number) => {
    if (!speedMs || speedMs === 0) return 'N/A';
    const minPerKm = 1000 / (speedMs * 60);
    const minutes = Math.floor(minPerKm);
    const seconds = Math.round((minPerKm - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} /km`;
  };

  const formatSpeed = (speedMs?: number) => {
    if (!speedMs) return 'N/A';
    return `${(speedMs * 3.6).toFixed(1)} km/h`;
  };

  const getActivityIcon = () => {
    const type = activity.activity_type?.toLowerCase();
    if (type?.includes('run')) return <Footprints className="w-8 h-8" />;
    if (type?.includes('ride') || type?.includes('bike')) return <Bike className="w-8 h-8" />;
    if (type?.includes('swim')) return <Waves className="w-8 h-8" />;
    if (type?.includes('strength') || type?.includes('weight')) return <Dumbbell className="w-8 h-8" />;
    if (type?.includes('hike')) return <Mountain className="w-8 h-8" />;
    return <Activity className="w-8 h-8" />;
  };

  const activityDate = new Date(activity.start_date);

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray sticky top-0 bg-iron-black z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/activities">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              {isEditing ? (
                <input
                  type="text"
                  value={editedActivity.name}
                  onChange={(e) => setEditedActivity({ ...editedActivity, name: e.target.value })}
                  className="bg-iron-gray/20 border border-iron-gray px-3 py-1 rounded text-xl font-heading text-iron-white"
                />
              ) : (
                <h1 className="font-heading text-2xl text-iron-orange">{activity.name}</h1>
              )}
            </div>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    onClick={() => {
                      setEditedActivity(activity);
                      setIsEditing(false);
                    }}
                    variant="ghost"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="ghost"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24">
        {/* Activity Type and Date */}
        <div className="flex items-center gap-6 mb-8">
          <div className={`p-4 rounded-full bg-iron-gray/20 text-iron-orange`}>
            {getActivityIcon()}
          </div>
          <div>
            <p className="text-2xl font-heading text-iron-white capitalize">
              {activity.sport_type?.replace(/_/g, ' ') || activity.activity_type?.replace(/_/g, ' ')}
            </p>
            <div className="flex items-center gap-4 text-iron-gray mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {activityDate.toLocaleDateString()}
              </span>
              <span>{activityDate.toLocaleTimeString()}</span>
              <span className="px-2 py-1 rounded text-xs bg-iron-gray/20 border border-iron-gray">
                {activity.source.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-iron-gray/10 border border-iron-gray p-6 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-iron-orange" />
              <span className="text-iron-gray text-sm uppercase">Duration</span>
            </div>
            <p className="text-3xl font-bold text-iron-white">
              {formatDuration(activity.elapsed_time_seconds)}
            </p>
            {activity.moving_time_seconds && activity.moving_time_seconds !== activity.elapsed_time_seconds && (
              <p className="text-sm text-iron-gray mt-1">
                Moving: {formatDuration(activity.moving_time_seconds)}
              </p>
            )}
          </div>

          {activity.distance_meters && (
            <div className="bg-iron-gray/10 border border-iron-gray p-6 rounded">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-iron-orange" />
                <span className="text-iron-gray text-sm uppercase">Distance</span>
              </div>
              <p className="text-3xl font-bold text-iron-white">
                {formatDistance(activity.distance_meters)}
              </p>
              {activity.average_speed && (
                <p className="text-sm text-iron-gray mt-1">
                  Pace: {formatPace(activity.average_speed)}
                </p>
              )}
            </div>
          )}

          {activity.average_heartrate && (
            <div className="bg-iron-gray/10 border border-iron-gray p-6 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="w-5 h-5 text-iron-orange" />
                <span className="text-iron-gray text-sm uppercase">Heart Rate</span>
              </div>
              <p className="text-3xl font-bold text-iron-white">
                {activity.average_heartrate} <span className="text-lg">bpm</span>
              </p>
              {activity.max_heartrate && (
                <p className="text-sm text-iron-gray mt-1">
                  Max: {activity.max_heartrate} bpm
                </p>
              )}
            </div>
          )}

          {activity.calories && (
            <div className="bg-iron-gray/10 border border-iron-gray p-6 rounded">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-iron-orange" />
                <span className="text-iron-gray text-sm uppercase">Calories</span>
              </div>
              <p className="text-3xl font-bold text-iron-white">
                {activity.calories}
              </p>
              {activity.kilojoules && (
                <p className="text-sm text-iron-gray mt-1">
                  {activity.kilojoules.toFixed(1)} kJ
                </p>
              )}
            </div>
          )}
        </div>

        {/* Performance Metrics */}
        {(activity.average_speed || activity.total_elevation_gain || activity.average_cadence || activity.average_power) && (
          <div className="mb-8">
            <h2 className="font-heading text-xl text-iron-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-iron-orange" />
              PERFORMANCE METRICS
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activity.average_speed && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">Avg Speed</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {formatSpeed(activity.average_speed)}
                  </p>
                  {activity.max_speed && (
                    <p className="text-sm text-iron-gray mt-1">
                      Max: {formatSpeed(activity.max_speed)}
                    </p>
                  )}
                </div>
              )}

              {activity.total_elevation_gain && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">Elevation Gain</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {Math.round(activity.total_elevation_gain)} m
                  </p>
                  {activity.total_elevation_loss && (
                    <p className="text-sm text-iron-gray mt-1">
                      Loss: {Math.round(activity.total_elevation_loss)} m
                    </p>
                  )}
                </div>
              )}

              {activity.average_cadence && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">Avg Cadence</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {Math.round(activity.average_cadence)} <span className="text-sm">spm</span>
                  </p>
                  {activity.max_cadence && (
                    <p className="text-sm text-iron-gray mt-1">
                      Max: {activity.max_cadence} spm
                    </p>
                  )}
                </div>
              )}

              {activity.average_power && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Battery className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">Avg Power</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {Math.round(activity.average_power)} W
                  </p>
                  {activity.normalized_power && (
                    <p className="text-sm text-iron-gray mt-1">
                      NP: {Math.round(activity.normalized_power)} W
                    </p>
                  )}
                </div>
              )}

              {activity.training_load && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">Training Load</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {activity.training_load.toFixed(1)}
                  </p>
                </div>
              )}

              {activity.vo2max_estimate && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">VO2 Max</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {activity.vo2max_estimate.toFixed(1)}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Running-specific Metrics */}
        {(activity.average_stride_length || activity.average_vertical_oscillation || activity.average_ground_contact_time) && (
          <div className="mb-8">
            <h2 className="font-heading text-xl text-iron-white mb-4 flex items-center gap-2">
              <Footprints className="w-5 h-5 text-iron-orange" />
              RUNNING DYNAMICS
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activity.average_stride_length && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <span className="text-iron-gray text-xs uppercase">Stride Length</span>
                  <p className="text-2xl font-bold text-iron-white mt-1">
                    {activity.average_stride_length.toFixed(2)} m
                  </p>
                </div>
              )}
              {activity.average_vertical_oscillation && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <span className="text-iron-gray text-xs uppercase">Vert Oscillation</span>
                  <p className="text-2xl font-bold text-iron-white mt-1">
                    {activity.average_vertical_oscillation.toFixed(1)} cm
                  </p>
                </div>
              )}
              {activity.average_ground_contact_time && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <span className="text-iron-gray text-xs uppercase">Ground Contact</span>
                  <p className="text-2xl font-bold text-iron-white mt-1">
                    {activity.average_ground_contact_time} ms
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subjective Metrics (Editable) */}
        <div className="mb-8">
          <h2 className="font-heading text-xl text-iron-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-iron-orange" />
            SUBJECTIVE METRICS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
              <span className="text-iron-gray text-xs uppercase block mb-2">Perceived Exertion</span>
              {isEditing ? (
                <select
                  value={editedActivity.perceived_exertion || ''}
                  onChange={(e) => setEditedActivity({
                    ...editedActivity,
                    perceived_exertion: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="bg-iron-gray/20 border border-iron-gray px-2 py-1 rounded text-iron-white w-full"
                >
                  <option value="">Not set</option>
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <option key={n} value={n}>{n}/10</option>
                  ))}
                </select>
              ) : (
                <p className="text-xl font-bold text-iron-white">
                  {activity.perceived_exertion ? `${activity.perceived_exertion}/10` : 'Not set'}
                </p>
              )}
            </div>

            <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
              <span className="text-iron-gray text-xs uppercase block mb-2">Mood</span>
              {isEditing ? (
                <select
                  value={editedActivity.mood || ''}
                  onChange={(e) => setEditedActivity({ ...editedActivity, mood: e.target.value })}
                  className="bg-iron-gray/20 border border-iron-gray px-2 py-1 rounded text-iron-white w-full"
                >
                  <option value="">Not set</option>
                  <option value="terrible">Terrible</option>
                  <option value="bad">Bad</option>
                  <option value="okay">Okay</option>
                  <option value="good">Good</option>
                  <option value="amazing">Amazing</option>
                </select>
              ) : (
                <p className="text-xl font-bold text-iron-white capitalize">
                  {activity.mood || 'Not set'}
                </p>
              )}
            </div>

            <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
              <span className="text-iron-gray text-xs uppercase block mb-2">Energy Level</span>
              {isEditing ? (
                <select
                  value={editedActivity.energy_level || ''}
                  onChange={(e) => setEditedActivity({
                    ...editedActivity,
                    energy_level: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="bg-iron-gray/20 border border-iron-gray px-2 py-1 rounded text-iron-white w-full"
                >
                  <option value="">Not set</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n}/5</option>
                  ))}
                </select>
              ) : (
                <p className="text-xl font-bold text-iron-white">
                  {activity.energy_level ? `${activity.energy_level}/5` : 'Not set'}
                </p>
              )}
            </div>

            <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
              <span className="text-iron-gray text-xs uppercase block mb-2">Workout Rating</span>
              {isEditing ? (
                <select
                  value={editedActivity.workout_rating || ''}
                  onChange={(e) => setEditedActivity({
                    ...editedActivity,
                    workout_rating: e.target.value ? parseInt(e.target.value) : null
                  })}
                  className="bg-iron-gray/20 border border-iron-gray px-2 py-1 rounded text-iron-white w-full"
                >
                  <option value="">Not set</option>
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{'⭐'.repeat(n)}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xl font-bold text-iron-white">
                  {activity.workout_rating ? '⭐'.repeat(activity.workout_rating) : 'Not set'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Weather Conditions */}
        {(activity.temperature_celsius || activity.humidity_percentage || activity.weather_conditions) && (
          <div className="mb-8">
            <h2 className="font-heading text-xl text-iron-white mb-4 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-iron-orange" />
              ENVIRONMENTAL CONDITIONS
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {activity.temperature_celsius && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">Temperature</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {activity.temperature_celsius.toFixed(1)}°C
                  </p>
                </div>
              )}
              {activity.humidity_percentage && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">Humidity</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {activity.humidity_percentage}%
                  </p>
                </div>
              )}
              {activity.wind_speed_kmh && (
                <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="w-4 h-4 text-iron-orange" />
                    <span className="text-iron-gray text-xs uppercase">Wind Speed</span>
                  </div>
                  <p className="text-2xl font-bold text-iron-white">
                    {activity.wind_speed_kmh.toFixed(1)} km/h
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes Section (Editable) */}
        <div className="mb-8">
          <h2 className="font-heading text-xl text-iron-white mb-4">NOTES</h2>
          {isEditing ? (
            <textarea
              value={editedActivity.notes || ''}
              onChange={(e) => setEditedActivity({ ...editedActivity, notes: e.target.value })}
              className="w-full bg-iron-gray/20 border border-iron-gray p-4 rounded text-iron-white min-h-[120px]"
              placeholder="Add notes about this activity..."
            />
          ) : (
            <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
              <p className="text-iron-white whitespace-pre-wrap">
                {activity.notes || 'No notes added'}
              </p>
            </div>
          )}
        </div>

        {/* Location Info */}
        {(activity.location || activity.city || activity.country) && (
          <div className="mb-8">
            <h2 className="font-heading text-xl text-iron-white mb-4">LOCATION</h2>
            <div className="bg-iron-gray/10 border border-iron-gray p-4 rounded">
              <p className="text-iron-white">
                {[activity.location, activity.city, activity.state, activity.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}