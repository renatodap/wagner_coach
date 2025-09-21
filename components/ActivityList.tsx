'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import {
  Activity,
  Clock,
  MapPin,
  Heart,
  Zap,
  TrendingUp,
  Calendar,
  ChevronRight,
  Play,
  Bike,
  Waves,
  Dumbbell,
  TreePine,
  Target,
  LinkIcon
} from 'lucide-react';

interface ActivityData {
  id: string;
  name: string;
  activity_type: string;
  sport_type: string;
  start_date: string;
  elapsed_time_seconds: number;
  distance_meters?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  source: string;
  average_speed?: number;
  total_elevation_gain?: number;
}

interface ActivityListProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
  onLinkActivity?: (activityId: string) => void;
}

const ACTIVITY_ICONS = {
  run: Play,
  trail_run: TreePine,
  virtual_run: Play,
  ride: Bike,
  virtual_ride: Bike,
  ebike_ride: Bike,
  mountain_bike_ride: Bike,
  swim: Waves,
  open_water_swim: Waves,
  strength_training: Dumbbell,
  crossfit: Target,
  hiit: Zap,
  yoga: Activity,
  pilates: Activity,
  walk: Play,
  hike: TreePine,
  workout: Activity,
};

const ACTIVITY_COLORS = {
  run: 'text-blue-400',
  trail_run: 'text-green-400',
  virtual_run: 'text-purple-400',
  ride: 'text-orange-400',
  virtual_ride: 'text-orange-400',
  ebike_ride: 'text-yellow-400',
  mountain_bike_ride: 'text-green-400',
  swim: 'text-cyan-400',
  open_water_swim: 'text-blue-400',
  strength_training: 'text-red-400',
  crossfit: 'text-orange-400',
  hiit: 'text-red-400',
  yoga: 'text-purple-400',
  pilates: 'text-purple-400',
  walk: 'text-gray-400',
  hike: 'text-green-400',
  workout: 'text-iron-orange',
};

export default function ActivityList({ limit = 10, showHeader = true, compact = false, onLinkActivity }: ActivityListProps) {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchActivities();
  }, [limit]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setActivities(data || []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return null;

    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${Math.round(meters)}m`;
  };

  const formatPace = (speed?: number, distance?: number) => {
    if (!speed || !distance) return null;

    // Convert m/s to min/km for running/walking activities
    const minutesPerKm = 1000 / (speed * 60);
    const minutes = Math.floor(minutesPerKm);
    const seconds = Math.round((minutesPerKm - minutes) * 60);

    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
  };

  const getActivityIcon = (activityType: string) => {
    const IconComponent = ACTIVITY_ICONS[activityType as keyof typeof ACTIVITY_ICONS] || Activity;
    return IconComponent;
  };

  const getActivityColor = (activityType: string) => {
    return ACTIVITY_COLORS[activityType as keyof typeof ACTIVITY_COLORS] || 'text-iron-orange';
  };

  const getSourceBadge = (source: string) => {
    const colors = {
      strava: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      manual: 'bg-iron-orange/20 text-iron-orange border-iron-orange/30',
      garmin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      apple_watch: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    return colors[source as keyof typeof colors] || colors.manual;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showHeader && (
          <h2 className="font-heading text-2xl text-iron-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-iron-orange" />
            RECENT ACTIVITIES
          </h2>
        )}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border border-iron-gray p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-iron-gray rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-iron-gray rounded w-3/4"></div>
                  <div className="h-3 bg-iron-gray rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-iron-gray mx-auto mb-4" />
        <p className="text-iron-gray">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-iron-gray mx-auto mb-4" />
        <h3 className="text-iron-white font-heading text-lg mb-2">No Activities Yet</h3>
        <p className="text-iron-gray text-sm">
          Connect your fitness tracker or log your first workout to see activities here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl text-iron-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-iron-orange" />
            RECENT ACTIVITIES
          </h2>
          {activities.length >= limit && (
            <Link
              href="/activities"
              className="text-iron-orange hover:text-orange-400 text-sm font-heading uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      <div className="space-y-3">
        {activities.map((activity) => {
          const IconComponent = getActivityIcon(activity.activity_type);
          const iconColor = getActivityColor(activity.activity_type);
          const distance = formatDistance(activity.distance_meters);
          const pace = formatPace(activity.average_speed, activity.distance_meters);

          return (
            <div
              key={activity.id}
              className="border border-iron-gray p-4 hover:border-iron-orange/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                {/* Activity Icon */}
                <div className={`p-2 rounded-full bg-iron-gray/20 ${iconColor} group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                {/* Activity Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-iron-white font-medium truncate">
                        {activity.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded border ${getSourceBadge(activity.source)}`}>
                          {activity.source.toUpperCase()}
                        </span>
                        <span className="text-iron-gray text-xs capitalize">
                          {activity.sport_type?.replace('_', ' ') || activity.activity_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    {onLinkActivity && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLinkActivity(activity.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-iron-orange/20 rounded"
                        title="Link to workout"
                      >
                        <LinkIcon className="w-4 h-4 text-iron-orange" />
                      </button>
                    )}
                  </div>

                  {/* Stats Grid */}
                  <div className={`grid gap-4 text-sm ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'}`}>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-iron-gray" />
                      <span className="text-iron-white">{formatDuration(activity.elapsed_time_seconds)}</span>
                    </div>

                    {distance && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-iron-gray" />
                        <span className="text-iron-white">{distance}</span>
                      </div>
                    )}

                    {activity.average_heartrate && (
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-iron-gray" />
                        <span className="text-iron-white">{activity.average_heartrate} bpm</span>
                      </div>
                    )}

                    {activity.calories && (
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-iron-gray" />
                        <span className="text-iron-white">{activity.calories} cal</span>
                      </div>
                    )}
                  </div>

                  {/* Additional Stats Row */}
                  {!compact && (distance || pace || activity.total_elevation_gain) && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3 pt-3 border-t border-iron-gray/30">
                      {pace && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-iron-gray" />
                          <span className="text-iron-gray">{pace}</span>
                        </div>
                      )}

                      {activity.total_elevation_gain && activity.total_elevation_gain > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-iron-gray" />
                          <span className="text-iron-gray">↗ {Math.round(activity.total_elevation_gain)}m</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-iron-gray" />
                        <span className="text-iron-gray">
                          {new Date(activity.start_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}