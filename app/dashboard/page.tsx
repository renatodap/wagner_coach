'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    console.log('🏠 Dashboard: Component mounted');
    
    async function getUser() {
      try {
        console.log('🔍 Dashboard: Fetching user...');
        const { data: { user }, error } = await supabase.auth.getUser();
        
        console.log('👤 Dashboard: User data:', user);
        console.log('❌ Dashboard: Error:', error);
        
        if (error) {
          console.error('💥 Dashboard: Auth error:', error);
          router.push('/auth');
          return;
        }
        
        if (!user) {
          console.log('🚫 Dashboard: No user, redirecting to auth');
          router.push('/auth');
          return;
        }
        
        console.log('✅ Dashboard: User found:', user.email);
        setUser(user);
      } catch (err) {
        console.error('💥 Dashboard: Catch block error:', err);
        router.push('/auth');
      } finally {
        setLoading(false);
        console.log('✅ Dashboard: Loading complete');
      }
    }
    
    getUser();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading text-iron-orange">LOADING...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-heading text-iron-orange">REDIRECTING...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-iron-black text-iron-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-5xl font-heading text-iron-orange uppercase tracking-wider">
            DASHBOARD
          </h1>
          <p className="mt-2 text-iron-gray">Welcome back, {user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-2 border-iron-orange p-6">
            <h2 className="font-heading text-3xl text-iron-orange">TODAY'S STATS</h2>
            <p className="text-iron-gray mt-2">Coming soon...</p>
          </div>

          <div className="border-2 border-iron-gray p-6">
            <h2 className="font-heading text-3xl text-iron-white">WORKOUTS</h2>
            <p className="text-iron-gray mt-2">Coming soon...</p>
          </div>

          <div className="border-2 border-iron-gray p-6">
            <h2 className="font-heading text-3xl text-iron-white">NUTRITION</h2>
            <p className="text-iron-gray mt-2">Coming soon...</p>
          </div>
        </div>

        <div className="mt-8 p-6 border border-iron-gray">
          <h2 className="font-heading text-2xl text-iron-orange mb-4">DEBUG INFO</h2>
          <pre className="text-sm text-iron-gray overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <button
          onClick={async () => {
            console.log('🚪 Signing out...');
            await supabase.auth.signOut();
            router.push('/');
          }}
          className="mt-8 bg-iron-orange text-iron-black px-6 py-3 font-heading uppercase hover:bg-orange-600"
        >
          SIGN OUT
        </button>
      </div>
    </div>
  );
}
