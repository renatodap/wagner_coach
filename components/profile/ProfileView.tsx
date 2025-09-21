'use client';

import React, { useState, useEffect } from 'react';
import { Profile, UserGoal } from '@/types/profile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Edit,
  Plus,
  Target,
  Trophy,
  Calendar,
  Activity,
  TrendingUp,
  Clock,
  Flame,
  Star,
  LogOut,
  Link as LinkIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProfileStats {
  totalWorkouts: number;
  currentStreak: number;
  goalsCompleted: number;
  totalMinutes: number;
  favoriteActivity: string;
  progressThisWeek: number;
}

interface ActivityItem {
  id: string;
  type: 'workout' | 'goal_update' | 'achievement';
  description: string;
  created_at: string;
}

interface ProfileViewProps {
  profile: Profile | null;
  goals: UserGoal[];
  stats: ProfileStats;
  recentActivity: ActivityItem[];
  onEditProfile: () => void;
  onEditGoal: (goalId: string) => void;
  onAddGoal: () => void;
}

export function ProfileView({
  profile,
  goals,
  stats,
  recentActivity,
  onEditProfile,
  onEditGoal,
  onAddGoal
}: ProfileViewProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  if (!profile) {
    return <ProfileSkeleton />;
  }

  const activeGoals = goals.filter(goal => goal.is_active);
  const canAddGoal = activeGoals.length < 5;

  return (
    <main
      className={cn(
        "container mx-auto p-6 space-y-6",
        isMobile ? "mobile-layout" : "desktop-layout"
      )}
      data-testid="profile-container"
      aria-label="User profile"
    >
      {/* Hero Section */}
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage
                src={profile.avatar_url || ''}
                alt="Profile avatar"
              />
              <AvatarFallback className="text-2xl">
                {profile.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div>
                <h1 className="text-3xl font-bold">
                  {profile.full_name || 'Unknown User'}
                </h1>
                <p className="text-muted-foreground">
                  {profile.email}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.age && (
                    <Badge variant="secondary">{profile.age} years</Badge>
                  )}
                  {profile.experience_level && (
                    <Badge variant="secondary">
                      {profile.experience_level.charAt(0).toUpperCase() + profile.experience_level.slice(1)}
                    </Badge>
                  )}
                  {profile.weekly_hours && (
                    <Badge variant="secondary">{profile.weekly_hours}h/week</Badge>
                  )}
                  {profile.location && (
                    <Badge variant="secondary">{profile.location}</Badge>
                  )}
                </div>
              </div>

              {profile.about_me && (
                <p className="text-sm text-muted-foreground max-w-2xl">
                  {profile.about_me}
                </p>
              )}

              {profile.primary_goal && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs font-medium text-muted-foreground mb-1">PRIMARY GOAL</p>
                  <p className="text-sm">{profile.primary_goal}</p>
                </div>
              )}
            </div>

            <Button onClick={onEditProfile} aria-label="Edit profile">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Section */}
      <section aria-label="Stats section">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">{stats.totalWorkouts.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Workouts</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Flame className="h-8 w-8 mx-auto mb-2 text-orange-500" />
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{stats.goalsCompleted}</div>
              <p className="text-sm text-muted-foreground">Goals Completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold">{stats.totalMinutes.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Minutes</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Preferences & Focus Areas */}
      {(profile.focus_areas?.length > 0 || profile.dietary_preferences || profile.equipment_access || profile.health_conditions) && (
        <section aria-label="Preferences section">
          <Card>
            <CardHeader>
              <CardTitle>Preferences & Focus Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile.focus_areas && profile.focus_areas.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Focus Areas</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.focus_areas.map((area) => (
                      <Badge key={area} variant="outline">
                        {area.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.dietary_preferences && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Dietary Preferences</p>
                    <p className="text-sm">{profile.dietary_preferences}</p>
                  </div>
                )}

                {profile.equipment_access && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Equipment Access</p>
                    <p className="text-sm">{profile.equipment_access}</p>
                  </div>
                )}

                {profile.health_conditions && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Health Considerations</p>
                    <p className="text-sm">{profile.health_conditions}</p>
                  </div>
                )}

                {profile.preferred_workout_time && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Preferred Workout Time</p>
                    <p className="text-sm">
                      {profile.preferred_workout_time.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </p>
                  </div>
                )}
              </div>

              {(profile.strengths || profile.areas_for_improvement) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {profile.strengths && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Strengths</p>
                      <p className="text-sm">{profile.strengths}</p>
                    </div>
                  )}

                  {profile.areas_for_improvement && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Areas for Improvement</p>
                      <p className="text-sm">{profile.areas_for_improvement}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Goals Section */}
      <section aria-label="Goals section">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Active Goals ({activeGoals.length}/5)
                </CardTitle>
                <CardDescription>
                  Track your fitness objectives and progress
                </CardDescription>
              </div>

              <Button
                onClick={onAddGoal}
                disabled={!canAddGoal}
                aria-label="Add goal"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Goal
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No active goals</h3>
                <p className="text-muted-foreground mb-4">
                  Set your first goal to get started!
                </p>
                <Button onClick={onAddGoal}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Goal
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {activeGoals.map((goal, index) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    progress={(goal as any).progress || 0}
                    onEdit={() => onEditGoal(goal.id)}
                  />
                ))}
              </div>
            )}

            {!canAddGoal && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Maximum goals reached (5/5)
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent Activity */}
      <section aria-label="Activity section">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1">
                      <p className="text-sm">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(activity.created_at), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Integrations Section */}
      <section aria-label="Integrations section">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LinkIcon className="mr-2 h-5 w-5" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Strava</p>
                    <p className="text-sm text-muted-foreground">Sync workouts automatically</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/settings'}>
                  Configure
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded flex items-center justify-center">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">Garmin Connect</p>
                    <p className="text-sm text-muted-foreground">Import training data</p>
                  </div>
                </div>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Account Actions */}
      <section aria-label="Account actions" className="space-y-4">
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out?')) {
              window.location.href = '/api/auth/signout';
            }
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </section>

      {/* Status for screen readers */}
      <div role="status" aria-live="polite" className="sr-only">
        {activeGoals.length > 0 && 'Goals updated'}
      </div>
    </main>
  );
}

function GoalCard({
  goal,
  progress,
  onEdit
}: {
  goal: UserGoal;
  progress: number;
  onEdit: () => void;
}) {
  return (
    <div
      data-testid={`goal-card-${goal.id}`}
      className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
      onClick={onEdit}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium">{goal.goal_description}</h4>
            <Badge variant="secondary" className="text-xs">
              Priority {goal.priority}
            </Badge>
          </div>

          {goal.target_value && goal.target_unit && (
            <p className="text-sm text-muted-foreground">
              Target: {goal.target_value} {goal.target_unit}
              {goal.target_date && ` by ${format(new Date(goal.target_date), 'MMM d, yyyy')}`}
            </p>
          )}
        </div>

        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      {progress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" aria-valuenow={progress} />
        </div>
      )}
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case 'workout':
      return <Activity className="h-4 w-4 text-blue-500 mt-0.5" />;
    case 'goal_update':
      return <Target className="h-4 w-4 text-green-500 mt-0.5" />;
    case 'achievement':
      return <Star className="h-4 w-4 text-yellow-500 mt-0.5" />;
    default:
      return <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />;
  }
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile..." className="container mx-auto p-6 space-y-6">
      <span className="sr-only">Loading profile...</span>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}