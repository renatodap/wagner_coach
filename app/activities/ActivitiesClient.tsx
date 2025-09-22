'use client';

import { useState } from 'react';
import {
  Calendar,
  Activity,
  Clock,
  TrendingUp,
  Heart,
  ChevronDown,
  ChevronUp,
  LinkIcon,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import ActivityList from '@/components/ActivityList';
import ActivityWorkoutLink from '@/components/ActivityWorkoutLink';
import BottomNavigation from '@/app/components/BottomNavigation';
import { Button } from '@/components/ui/button';

export default function ActivitiesClient() {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [selectedActivitySource, setSelectedActivitySource] = useState<'strava' | 'garmin' | 'manual'>('manual');
  const [showLinkModal, setShowLinkModal] = useState(false);

  const handleToggleActivities = () => {
    setShowAllActivities(!showAllActivities);
  };

  const handleLinkActivity = async (activityId: string, source: 'strava' | 'garmin' | 'manual' = 'manual') => {
    setSelectedActivityId(activityId);
    setSelectedActivitySource(source);
    setShowLinkModal(true);
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="font-heading text-4xl text-iron-orange">MY ACTIVITIES</h1>
            <Link href="/activities/add">
              <Button className="bg-iron-orange text-iron-black hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Activity
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 space-y-8">
        {/* Quick Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="border border-iron-gray p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-iron-orange" />
              <span className="text-iron-gray text-sm">THIS WEEK</span>
            </div>
            <p className="text-2xl font-bold text-iron-white">5 workouts</p>
          </div>

          <div className="border border-iron-gray p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-iron-orange" />
              <span className="text-iron-gray text-sm">TOTAL TIME</span>
            </div>
            <p className="text-2xl font-bold text-iron-white">6h 23m</p>
          </div>

          <div className="border border-iron-gray p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-iron-orange" />
              <span className="text-iron-gray text-sm">AVG HEART RATE</span>
            </div>
            <p className="text-2xl font-bold text-iron-white">142 bpm</p>
          </div>

          <div className="border border-iron-gray p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-iron-orange" />
              <span className="text-iron-gray text-sm">CURRENT STREAK</span>
            </div>
            <p className="text-2xl font-bold text-iron-white">3 days</p>
          </div>
        </div>

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