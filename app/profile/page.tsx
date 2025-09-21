'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileView } from '@/components/profile/ProfileView';
import { Profile, UserGoal } from '@/types/profile';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

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
  const { toast } = useToast();

  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile data on mount
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

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
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
      // Don't show error toast for goals, just log it
      setGoals([]);
    }
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleEditGoal = (goalId: string) => {
    router.push(`/profile/goals/${goalId}/edit`);
  };

  const handleAddGoal = () => {
    router.push('/profile/goals/add');
  };

  const refreshData = async () => {
    await Promise.all([loadProfileData(), loadGoals()]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Unable to Load Profile</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">
            Your profile data could not be found. You may need to complete onboarding.
          </p>
          <button
            onClick={() => router.push('/profile/onboarding')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Complete Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProfileView
      profile={profileData.profile}
      goals={goals}
      stats={profileData.stats}
      recentActivity={profileData.recentActivity}
      onEditProfile={handleEditProfile}
      onEditGoal={handleEditGoal}
      onAddGoal={handleAddGoal}
    />
  );
}