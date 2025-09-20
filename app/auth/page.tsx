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
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Update profile with full name
          await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id);

          router.push('/auth/onboarding');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Check if user has completed onboarding
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .single();

          if (profile?.onboarding_completed) {
            router.push('/dashboard');
          } else {
            router.push('/auth/onboarding');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-iron-black text-iron-white flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Back to Home */}
        <Link
          href="/"
          className="text-iron-gray hover:text-iron-orange transition-colors text-sm"
        >
          ← Back
        </Link>

        {/* Header */}
        <div className="text-center">
          <h1 className="font-heading text-4xl text-iron-orange uppercase tracking-wider">
            {isSignUp ? 'Join the Elite' : 'Welcome Back'}
          </h1>
          <p className="mt-2 text-iron-gray">
            {isSignUp ? 'Start your transformation journey' : 'Continue your training'}
          </p>
        </div>

        {/* Form */}
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
            <div className="text-iron-orange text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-iron-orange text-iron-black font-heading text-xl py-3 uppercase tracking-widest hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Loading...' : (isSignUp ? 'Start Training' : 'Enter Gym')}
          </button>
        </form>

        {/* Toggle Sign In/Up */}
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