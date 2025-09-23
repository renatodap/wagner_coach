'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserGoal } from '@/types/profile';
import BottomNavigation from '@/app/components/BottomNavigation';
import IntegrationsSection from '@/components/IntegrationsSection';
import UnitSystemToggle from '@/components/UnitSystemToggle';
import {
  Loader2,
  User,
  Target,
  Trophy,
  Activity,
  Clock,
  Flame,
  Edit,
  Plus,
  LogOut,
  Settings,
  Link as LinkIcon,
  ChevronRight
} from 'lucide-react';

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

interface ProfileData {
  profile: Profile;
  stats: ProfileStats;
  recentActivity: ActivityItem[];
  recommendations: any[];
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
    loadGoals();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load profile');
      }

      const data = await response.json();
      setProfileData(data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMessage);
      console.error('Profile load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGoals = async () => {
    try {
      const response = await fetch('/api/profile/goals?status=active', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load goals');
      }

      const data = await response.json();
      setGoals(data.goals || []);

    } catch (err) {
      console.error('Goals load error:', err);
      setGoals([]);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-iron-orange" />
          <p className="text-iron-gray">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md">
            <h2 className="font-heading text-2xl text-iron-orange mb-2 uppercase">Unable to Load Profile</h2>
            <p className="text-iron-gray mb-6">{error}</p>
            <button
              onClick={loadProfileData}
              className="bg-iron-orange text-iron-black font-heading px-6 py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const profile = profileData?.profile;
  const stats = profileData?.stats || {
    totalWorkouts: 0,
    currentStreak: 0,
    goalsCompleted: 0,
    totalMinutes: 0,
    favoriteActivity: 'Not enough data',
    progressThisWeek: 0
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="font-heading text-3xl text-iron-orange uppercase tracking-wider">
            Profile
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* User Info Section */}
        <div className="border border-iron-gray p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-iron-gray rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-iron-orange" />
              </div>
              <div>
                <h2 className="font-heading text-2xl text-iron-white">
                  {profile?.full_name || 'User'}
                </h2>
                <p className="text-iron-gray">{profile?.email}</p>
                {profile?.primary_goal && (
                  <p className="text-sm text-iron-orange mt-2">
                    Primary Goal: {profile.primary_goal}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => router.push('/profile/edit')}
              className="text-iron-orange hover:text-orange-600 transition-colors"
            >
              <Edit className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            {profile?.age && (
              <div className="text-sm">
                <span className="text-iron-gray">Age:</span>{' '}
                <span className="text-iron-white">{profile.age} years</span>
              </div>
            )}
            {profile?.experience_level && (
              <div className="text-sm">
                <span className="text-iron-gray">Level:</span>{' '}
                <span className="text-iron-white capitalize">{profile.experience_level}</span>
              </div>
            )}
            {profile?.weekly_hours !== undefined && (
              <div className="text-sm">
                <span className="text-iron-gray">Weekly Hours:</span>{' '}
                <span className="text-iron-white">{profile.weekly_hours}h</span>
              </div>
            )}
            {profile?.location && (
              <div className="text-sm">
                <span className="text-iron-gray">Location:</span>{' '}
                <span className="text-iron-white">{profile.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="border border-iron-gray p-4 text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-iron-orange" />
            <div className="font-heading text-2xl text-iron-white">
              {(stats.totalWorkouts || 0).toLocaleString()}
            </div>
            <p className="text-iron-gray text-xs uppercase">Workouts</p>
          </div>

          <div className="border border-iron-gray p-4 text-center">
            <Flame className="w-8 h-8 mx-auto mb-2 text-iron-orange" />
            <div className="font-heading text-2xl text-iron-white">
              {stats.currentStreak || 0}
            </div>
            <p className="text-iron-gray text-xs uppercase">Day Streak</p>
          </div>

          <div className="border border-iron-gray p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-iron-orange" />
            <div className="font-heading text-2xl text-iron-white">
              {stats.goalsCompleted || 0}
            </div>
            <p className="text-iron-gray text-xs uppercase">Goals Won</p>
          </div>

          <div className="border border-iron-gray p-4 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-iron-orange" />
            <div className="font-heading text-2xl text-iron-white">
              {(stats.totalMinutes || 0).toLocaleString()}
            </div>
            <p className="text-iron-gray text-xs uppercase">Minutes</p>
          </div>
        </div>

        {/* Goals Section */}
        <div className="border border-iron-gray p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-xl text-iron-white flex items-center gap-2">
              <Target className="w-5 h-5 text-iron-orange" />
              ACTIVE GOALS ({goals.length}/5)
            </h3>
            <button
              onClick={() => router.push('/profile/goals/add')}
              disabled={goals.length >= 5}
              className={`flex items-center gap-2 px-4 py-2 uppercase font-heading text-sm transition-colors ${
                goals.length >= 5
                  ? 'bg-iron-gray/50 text-iron-gray cursor-not-allowed'
                  : 'bg-iron-orange text-iron-black hover:bg-orange-600'
              }`}
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-8">
              <Target className="w-12 h-12 mx-auto mb-4 text-iron-gray" />
              <p className="text-iron-gray mb-4">No active goals</p>
              <button
                onClick={() => router.push('/profile/goals/add')}
                className="bg-iron-orange text-iron-black font-heading px-4 py-2 uppercase tracking-wider hover:bg-orange-600 transition-colors"
              >
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  onClick={() => router.push(`/profile/goals/${goal.id}/edit`)}
                  className="p-4 border border-iron-gray hover:border-iron-orange transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-iron-white">{goal.goal_description || goal.description}</p>
                      {goal.target_value && goal.target_unit && (
                        <p className="text-sm text-iron-gray mt-1">
                          Target: {goal.target_value} {goal.target_unit}
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 text-iron-gray" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Focus Areas */}
        {profile?.focus_areas && profile.focus_areas.length > 0 && (
          <div className="border border-iron-gray p-6">
            <h3 className="font-heading text-xl text-iron-white mb-4">FOCUS AREAS</h3>
            <div className="flex flex-wrap gap-2">
              {profile.focus_areas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 bg-iron-gray/30 border border-iron-gray text-iron-white text-sm uppercase"
                >
                  {area.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Integrations */}
        <IntegrationsSection />

        {/* Unit System Preferences */}
        <UnitSystemToggle />

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full border-2 border-red-600 text-red-600 font-heading text-xl py-4 uppercase tracking-wider hover:bg-red-600 hover:text-iron-white transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}