'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Activity,
  Dumbbell,
  Calendar,
  Settings
} from 'lucide-react';
import ActivityList from '@/components/ActivityList';

export default function ActivitiesClient() {
  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <h1 className="font-heading text-2xl text-iron-orange uppercase tracking-wider">
              All Activities
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <ActivityList limit={50} showHeader={false} />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-iron-black border-t border-iron-gray">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-4 py-2">
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-1 py-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <Dumbbell className="w-5 h-5" />
              <span className="text-[10px] uppercase">Workouts</span>
            </Link>
            <Link
              href="/activities"
              className="flex flex-col items-center gap-1 py-2 text-iron-orange"
            >
              <Activity className="w-5 h-5" />
              <span className="text-[10px] uppercase">Activities</span>
            </Link>
            <Link
              href="/progress"
              className="flex flex-col items-center gap-1 py-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] uppercase">Progress</span>
            </Link>
            <Link
              href="/settings"
              className="flex flex-col items-center gap-1 py-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-[10px] uppercase">Settings</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}