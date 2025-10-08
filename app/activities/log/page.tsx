'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ActivityLogForm from '@/components/activities/ActivityLogForm';
import BottomNavigation from '@/app/components/BottomNavigation';

export default function ActivityLogPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push('/auth');
          return;
        }

        setUser(user);
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading text-iron-orange">LOADING...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 pb-24">
      {/* Header */}
      <div className="bg-iron-black/50 backdrop-blur-sm border-b border-iron-gray/20">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-iron-orange hover:text-orange-400 transition-colors"
              aria-label="Back to dashboard"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Log Activity</h1>
              <p className="text-iron-gray">Track your workouts and activities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ActivityLogForm />
      </div>

      <BottomNavigation />
    </div>
  );
}
