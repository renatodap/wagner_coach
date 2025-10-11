'use client';

import { useState } from 'react';
import {
  Activity,
  ChevronDown,
  ChevronUp,
  LinkIcon,
  Plus,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import ActivityList from '@/components/ActivityList';
import ActivityWorkoutLink from '@/components/ActivityWorkoutLink';
import BottomNavigation from '@/components/BottomNavigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ActivitiesClient() {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedActivitySource, setSelectedActivitySource] = useState<'strava' | 'garmin' | 'manual'>('manual');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleToggleActivities = () => {
    setShowAllActivities(!showAllActivities);
  };

  const handleLinkActivity = async (activityId: string, source: 'strava' | 'garmin' | 'manual' = 'manual') => {
    setSelectedActivityId(activityId);
    setSelectedActivitySource(source);
    setShowLinkModal(true);
  };

  const handleSyncActivities = async () => {
    setIsSyncing(true);
    try {
      // Check which services are connected and sync them
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to sync activities');
        return;
      }

      let syncMessages = [];

      // Check and sync Strava
      const { data: stravaConnection } = await supabase
        .from('strava_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (stravaConnection) {
        try {
          const stravaResponse = await fetch('/api/strava/activities', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ source: 'strava' })
          });

          if (stravaResponse.ok) {
            const stravaData = await stravaResponse.json();
            syncMessages.push(`Strava: ${stravaData.syncedCount || 0} activities`);
          }
        } catch (error) {
          console.error('Strava sync error:', error);
        }
      }

      // Check and sync Garmin
      const garminResponse = await fetch('/api/connections/garmin');
      if (garminResponse.ok) {
        const garminData = await garminResponse.json();
        if (garminData.connected) {
          // Sync Garmin activities through the Python API
          alert('Garmin sync in progress. Please check back in a moment.');
        }
      }

      if (syncMessages.length > 0) {
        alert(`Sync complete:\n${syncMessages.join('\n')}`);
        router.refresh();
      } else {
        alert('No connected services found. Connect Strava or Garmin in your profile.');
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Failed to sync activities');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-4xl text-iron-orange">MY ACTIVITIES</h1>
            <div className="flex gap-2">
              <Button
                onClick={handleSyncActivities}
                disabled={isSyncing}
                variant="outline"
                className="border-iron-orange text-iron-orange hover:bg-iron-orange hover:text-iron-black"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
              <Link href="/activities/add">
                <Button className="bg-iron-orange text-iron-black hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Manual
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Activities List Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl text-iron-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-iron-orange" />
              {showAllActivities ? 'ALL ACTIVITIES' : 'RECENT ACTIVITIES'}
            </h2>
            <button
              onClick={handleToggleActivities}
              className="text-iron-orange hover:text-orange-400 text-sm font-heading uppercase tracking-wider flex items-center gap-1 transition-colors"
            >
              {showAllActivities ? 'Show Less' : 'View All'}
              {showAllActivities ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Activity List with Link Button */}
          <div className="relative">
            <ActivityList
              limit={showAllActivities ? 500 : 10}
              showHeader={false}
              onLinkActivity={handleLinkActivity}
            />

            {/* Add link functionality to each activity item */}
            {/* This would be integrated into ActivityList component */}
          </div>
        </div>

        {/* Workout Linking Info */}
        <div className="bg-blue-900/20 border border-blue-500/50 p-4 rounded">
          <div className="flex items-start gap-3">
            <LinkIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-400 font-medium mb-1">Link Activities to Workouts</p>
              <p className="text-blue-300/80">
                You can link your completed activities to specific workouts in the library.
                This helps track which workouts you&apos;ve completed and builds your progress history.
                Click the link icon on any activity to connect it to a workout.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Activity-Workout Link Modal */}
      {selectedActivityId && (
        <ActivityWorkoutLink
          activityId={selectedActivityId}
          activitySource={selectedActivitySource}
          isOpen={showLinkModal}
          onClose={() => {
            setShowLinkModal(false);
            setSelectedActivityId(null);
          }}
          onLink={() => {
            // Refresh activity list or show success
          }}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}