'use client';

import Link from 'next/link';
import {
  ArrowLeft
} from 'lucide-react';
import ActivityList from '@/components/ActivityList';
import BottomNavigation from '@/app/components/BottomNavigation';

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
        <ActivityList limit={100} showHeader={false} />
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}