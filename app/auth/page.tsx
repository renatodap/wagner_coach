'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔥 FORM SUBMITTED!');
    console.log('📧 Email:', email);
    console.log('🔑 Password length:', password.length);
    console.log('📍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('🎫 Has API key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        console.log('📝 Sign up mode');
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        console.log('📦 SignUp Response:', { data, error });

        if (error) throw error;

        if (data.user) {
          // Use UPSERT to create or update profile (defensive programming)
          const { error: profileError } = await (supabase as any)
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: fullName
            })
            .select()
            .single();

          if (profileError) {
            console.error('❌ Profile creation error:', profileError);
            throw new Error('Failed to create user profile. Please try again.');
          }

          console.log('✅ Profile created, redirecting to onboarding');
          router.push('/auth/onboarding');
        }
      } else {
        console.log('🔐 Sign in mode - START');
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('📦 SignIn Response data:', data);
        console.log('❌ SignIn Response error:', error);

        if (error) {
          console.error('💥 Auth error object:', error);
          throw error;
        }

        if (data.user) {
          console.log('👤 User logged in:', data.user.email);
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .single();

          console.log('📋 Profile:', profile);

          if (profile?.onboarding_completed) {
            console.log('✅ Redirecting to dashboard');
            router.push('/dashboard');
          } else {
            console.log('✅ Redirecting to onboarding');
            router.push('/auth/onboarding');
          }
        }
      }
    } catch (err) {
      console.error('💥 CATCH BLOCK - Error:', err);
      const errorMessage = (err as Error).message || 'An error occurred';
      console.log('💬 Setting error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('✅ Auth complete, loading=false');
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <Link
          href="/"
          className="text-iron-gray hover:text-iron-orange transition-colors text-sm"
        >
          ← Back
        </Link>

        <div className="text-center">
          <h1 className="font-heading text-4xl text-iron-orange uppercase tracking-wider">
            {isSignUp ? 'Join the Elite' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-iron-gray">
            {isSignUp ? 'Start your transformation journey' : 'Continue your training'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-iron-gray uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                required={isSignUp}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-iron-black border-2 border-iron-gray text-iron-white focus:outline-none focus:border-iron-orange"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-iron-gray uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-iron-black border-2 border-iron-gray text-iron-white focus:outline-none focus:border-iron-orange"
              placeholder="warrior@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-iron-gray uppercase tracking-wider">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-iron-black border-2 border-iron-gray text-iron-white focus:outline-none focus:border-iron-orange"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-iron-orange text-sm border border-iron-orange p-3 bg-iron-orange/10">
              <strong>ERROR:</strong> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-iron-orange text-iron-black font-heading text-xl py-3 uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'LOADING...' : (isSignUp ? 'Start Training' : 'Enter Gym')}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-iron-gray hover:text-iron-orange transition-colors text-sm"
          >
            {isSignUp
              ? 'Already have an account? Sign in'
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
