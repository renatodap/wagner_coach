'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserGoal } from '@/types/profile';
import BottomNavigation from '@/app/components/BottomNavigation';
import IntegrationsSection from '@/components/IntegrationsSection';
import UnitSystemToggle from '@/components/UnitSystemToggle';
import { DashboardSettingsCard } from '@/components/profile/DashboardSettingsCard';
import {
  Loader2,
  User,
  Trophy,
  Activity,
  Clock,
  Flame,
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
          <h1 className="font-heading text-2xl sm:text-3xl text-iron-orange uppercase tracking-wider">
            Profile
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* User Info Section */}
        <div className="border border-iron-gray p-4 sm:p-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-iron-gray rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-iron-orange" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading text-xl sm:text-2xl text-iron-white break-words">
                  {profile?.full_name || 'User'}
                </h2>
                <p className="text-sm sm:text-base text-iron-gray break-all">{profile?.email}</p>
                {profile?.primary_goal && (
                  <p className="text-xs sm:text-sm text-iron-orange mt-2 break-words">
                    Primary Goal: {profile.primary_goal}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
            {profile?.age && (
              <div className="text-xs sm:text-sm">
                <span className="text-iron-gray">Age:</span>{' '}
                <span className="text-iron-white">{profile.age} years</span>
              </div>
            )}
            {profile?.experience_level && (
              <div className="text-xs sm:text-sm">
                <span className="text-iron-gray">Level:</span>{' '}
                <span className="text-iron-white capitalize">{profile.experience_level}</span>
              </div>
            )}
            {profile?.weekly_hours !== undefined && (
              <div className="text-xs sm:text-sm">
                <span className="text-iron-gray">Weekly Hours:</span>{' '}
                <span className="text-iron-white">{profile.weekly_hours}h</span>
              </div>
            )}
            {profile?.location && (
              <div className="text-xs sm:text-sm">
                <span className="text-iron-gray">Location:</span>{' '}
                <span className="text-iron-white break-words">{profile.location}</span>
              </div>
            )}
          </div>
        </div>


        {/* Focus Areas */}
        {profile?.focus_areas && profile.focus_areas.length > 0 && (
          <div className="border border-iron-gray p-4 sm:p-6">
            <h3 className="font-heading text-lg sm:text-xl text-iron-white mb-3 sm:mb-4">FOCUS AREAS</h3>
            <div className="flex flex-wrap gap-2">
              {profile.focus_areas.map((area) => (
                <span
                  key={area}
                  className="px-2 sm:px-3 py-1 bg-iron-gray/30 border border-iron-gray text-iron-white text-xs sm:text-sm uppercase"
                >
                  {area.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Settings */}
        <DashboardSettingsCard />

        {/* Program Preferences */}
        <div className="border border-iron-gray p-4 sm:p-6">
          <h3 className="font-heading text-lg sm:text-xl text-iron-white mb-3 sm:mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-iron-orange" />
            PROGRAM PREFERENCES
          </h3>
          <button
            onClick={() => router.push('/profile/preferences')}
            className="w-full flex items-center justify-between p-3 sm:p-4 border border-iron-gray hover:border-iron-orange transition-colors"
          >
            <div className="text-left min-w-0 flex-1 pr-2">
              <p className="text-sm sm:text-base text-iron-white mb-1">Training & Nutrition Settings</p>
              <p className="text-xs sm:text-sm text-iron-gray">Update your goals, training frequency, dietary preferences, and more</p>
            </div>
            <ChevronRight className="w-5 h-5 text-iron-gray flex-shrink-0" />
          </button>
        </div>

        {/* Integrations */}
        <IntegrationsSection />

        {/* Unit System Preferences */}
        <UnitSystemToggle />

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full border-2 border-red-600 text-red-600 font-heading text-base sm:text-lg md:text-xl py-3 sm:py-4 uppercase tracking-wider hover:bg-red-600 hover:text-iron-white transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          Sign Out
        </button>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}