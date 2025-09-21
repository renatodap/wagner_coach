import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import WorkoutAnalytics from '@/components/analytics/WorkoutAnalytics';

export default async function AnalyticsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Header */}
      <header className="border-b border-iron-gray">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-iron-gray hover:text-iron-orange transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <h1 className="font-heading text-2xl text-iron-orange uppercase tracking-wider">
              Performance Analytics
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Date Range Tabs */}
        <div className="flex gap-4 mb-8">
          <Link
            href="/analytics?range=week"
            className="px-4 py-2 border-2 border-iron-orange bg-iron-orange text-iron-black font-heading uppercase tracking-wider"
          >
            This Week
          </Link>
          <Link
            href="/analytics?range=month"
            className="px-4 py-2 border-2 border-iron-gray text-iron-gray hover:border-iron-orange hover:text-iron-orange transition-colors font-heading uppercase tracking-wider"
          >
            This Month
          </Link>
          <Link
            href="/analytics?range=all"
            className="px-4 py-2 border-2 border-iron-gray text-iron-gray hover:border-iron-orange hover:text-iron-orange transition-colors font-heading uppercase tracking-wider"
          >
            All Time
          </Link>
        </div>

        {/* Analytics Component */}
        <WorkoutAnalytics userId={user.id} dateRange="week" />

        {/* Motivational Section */}
        <div className="mt-12 border-t border-iron-gray pt-8">
          <div className="text-center">
            <h2 className="font-heading text-3xl text-iron-orange mb-4">
              KEEP PUSHING YOUR LIMITS
            </h2>
            <p className="text-iron-gray max-w-2xl mx-auto">
              Every rep, every set, every workout brings you closer to your goals.
              Track your progress, beat your records, and become the strongest version of yourself.
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-6 px-8 py-3 bg-iron-orange text-iron-black font-heading text-xl uppercase tracking-wider hover:bg-orange-600 transition-colors"
            >
              Start Today's Workout
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}