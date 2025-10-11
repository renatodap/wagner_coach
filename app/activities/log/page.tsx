'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ActivityLogForm from '@/components/activities/ActivityLogForm';
import BottomNavigation from '@/app/components/BottomNavigation';
import type { CreateActivityRequest, ActivityType } from '@/types/activity';

function ActivityLogContent() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [initialData, setInitialData] = useState<Partial<CreateActivityRequest> | undefined>();
  const [preSelectedType, setPreSelectedType] = useState<ActivityType | undefined>();
  const router = useRouter();
  const searchParams = useSearchParams();
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

  useEffect(() => {
    // Check for pre-populated data from coach or quick entry
    const previewDataParam = searchParams.get('previewData');
    const activityTypeParam = searchParams.get('activityType');

    if (previewDataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(previewDataParam));
        console.log('[ActivityLogPage] Parsed preview data:', parsedData);
        setInitialData(parsedData);

        // If activity type is in the data, use it
        if (parsedData.activity_type) {
          setPreSelectedType(parsedData.activity_type as ActivityType);
        }
      } catch (error) {
        console.error('[ActivityLogPage] Failed to parse preview data:', error);
      }
    } else if (activityTypeParam) {
      // Just activity type specified (no data)
      setPreSelectedType(activityTypeParam as ActivityType);
    }
  }, [searchParams]);

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
        <ActivityLogForm
          initialData={initialData}
          preSelectedType={preSelectedType}
          onSubmit={() => {
            const returnTo = searchParams.get('returnTo') || '/activities';
            router.push(returnTo);
          }}
          onCancel={() => {
            const returnTo = searchParams.get('returnTo') || '/activities';
            router.push(returnTo);
          }}
        />
      </div>

      <BottomNavigation />
    </div>
  );
}

export default function ActivityLogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-iron-black to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading text-iron-orange">LOADING...</h1>
        </div>
      </div>
    }>
      <ActivityLogContent />
    </Suspense>
  );
}
