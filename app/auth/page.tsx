'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
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
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          // Show success message - user needs to verify email
          setError('');
          setSignupSuccess(true);

          // Reset form
          setPassword('');
          setFullName('');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          // Check if profile exists and if onboarding is completed
          const { data: profile, error: profileError } = await (supabase as any)
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('Profile fetch error:', profileError);
            // Profile might not exist yet (shouldn't happen with trigger)
            router.push('/auth/onboarding');
            return;
          }

          if (profile?.onboarding_completed) {
            router.push('/dashboard');
          } else {
            router.push('/auth/onboarding');
          }
        }
      }
    } catch (err) {
      const errorMessage = (err as Error).message || 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
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

        {signupSuccess ? (
          <div className="bg-green-900/20 border-2 border-green-600 rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="h-6 w-6" />
              <h3 className="font-heading text-xl uppercase">Account Created!</h3>
            </div>
            <p className="text-iron-gray">
              We've sent a verification email to <strong className="text-iron-white">{email}</strong>
            </p>
            <p className="text-sm text-iron-gray">
              Check your inbox and click the verification link, then return here to log in.
            </p>
            <button
              onClick={() => {
                setSignupSuccess(false);
                setIsSignUp(false);
              }}
              className="w-full mt-4 bg-iron-orange text-iron-black font-heading py-2 uppercase tracking-widest hover:bg-orange-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
