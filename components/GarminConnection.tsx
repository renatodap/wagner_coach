'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Activity, Loader2, Link as LinkIcon, Unlink, RefreshCcw, Eye, EyeOff } from 'lucide-react';

interface GarminConnectionProps {
  className?: string;
}

export default function GarminConnection({ className = '' }: GarminConnectionProps) {
  const supabase = createClient();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    checkGarminConnection();
  }, []);

  const checkGarminConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('garmin_connections')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        setIsConnected(data.is_active);
        setLastSync(data.last_sync);
        // Load saved email from local storage if available
        const savedEmail = localStorage.getItem('garmin_email');
        if (savedEmail) setEmail(savedEmail);
      }
    } catch (err) {
      // Table might not exist yet, ignore error
      console.log('Garmin connections table may not exist yet');
    }
  };

  const handleConnect = async () => {
    if (!email || !password) {
      setError('Please enter your Garmin Connect credentials');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setSyncResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save email to local storage for convenience
      localStorage.setItem('garmin_email', email);

      // Call Python API to test connection and sync data
      const response = await fetch('/api/garmin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          userId: user.id,
          daysBack: 30
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to connect to Garmin');
      }

      const result = await response.json();

      // Check if it's an error response
      if (result.error) {
        // Handle specific error cases with better user guidance
        if (result.error.includes('authentication failed')) {
          throw new Error('Authentication failed. Please verify:\n1. Your email and password are correct\n2. You can log in at connect.garmin.com\n3. Your account is not locked\n4. Two-factor authentication is disabled or app password is used');
        } else if (result.error.includes('Too many requests')) {
          throw new Error('Garmin is temporarily blocking requests. Please wait 10-15 minutes before trying again.');
        } else {
          throw new Error(result.error + (result.details ? `\n${result.details}` : ''));
        }
      }

      setIsConnected(true);
      setSyncResult(`Successfully synced ${result.activitiesSynced || 0} activities from Garmin`);

      // Update local state
      await checkGarminConnection();

      // Clear password for security
      setPassword('');

    } catch (err) {
      setError((err as Error).message || 'Failed to connect to Garmin');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('garmin_connections')
        .update({ is_active: false })
        .eq('user_id', user.id);

      setIsConnected(false);
      setEmail('');
      setPassword('');
      localStorage.removeItem('garmin_email');
      setSyncResult(null);
    } catch (err) {
      setError('Failed to disconnect from Garmin');
    }
  };

  const handleSync = async () => {
    if (!email) {
      setError('Please enter your Garmin email first');
      return;
    }

    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const response = await fetch('/api/garmin/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password: password || undefined, // Use saved session if no password
          limit: 50
        })
      });

      if (!response.ok) {
        throw new Error('Sync failed - you may need to re-enter your password');
      }

      const data = await response.json();
      setSyncResult(`Synced ${data.activities.length} recent activities`);

      // Update last sync time
      await supabase
        .from('garmin_connections')
        .update({ last_sync: new Date().toISOString() })
        .eq('user_id', user.id);

      await checkGarminConnection();

    } catch (err) {
      setError((err as Error).message || 'Failed to sync Garmin data');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`border border-iron-gray p-6 ${className}`}>
      <h2 className="font-heading text-2xl text-iron-white mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-iron-orange" />
        GARMIN CONNECT
      </h2>

      {!isConnected ? (
        <div className="space-y-4">
          <p className="text-iron-gray text-sm">
            Connect your Garmin account to automatically sync your fitness activities
          </p>

          <div>
            <label htmlFor="garmin-email" className="block text-iron-gray text-xs uppercase mb-2">
              Garmin Email
            </label>
            <input
              id="garmin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full bg-iron-black border border-iron-gray px-4 py-3 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
            />
          </div>

          <div>
            <label htmlFor="garmin-password" className="block text-iron-gray text-xs uppercase mb-2">
              Garmin Password
            </label>
            <div className="relative">
              <input
                id="garmin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-iron-black border border-iron-gray px-4 py-3 pr-12 text-iron-white focus:outline-none focus:border-iron-orange transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-iron-gray hover:text-iron-orange transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <p className="text-iron-gray text-xs">
            Your credentials are used only to connect to Garmin and are not stored on our servers
          </p>

          {error && (
            <div className="text-red-500 text-sm border border-red-500 p-3 whitespace-pre-line">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            disabled={isConnecting || !email || !password}
            className="w-full bg-iron-orange text-iron-black font-heading py-3 uppercase tracking-wider hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <LinkIcon className="w-5 h-5" />
                Connect Garmin
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm">Connected</span>
            </div>
            {lastSync && (
              <span className="text-iron-gray text-xs">
                Last sync: {new Date(lastSync).toLocaleString()}
              </span>
            )}
          </div>

          {syncResult && (
            <div className="text-green-500 text-sm border border-green-500 p-3">
              {syncResult}
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm border border-red-500 p-3 whitespace-pre-line">
              {error}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex-1 bg-iron-gray/20 border border-iron-gray text-iron-white font-heading py-3 uppercase tracking-wider hover:bg-iron-gray/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCcw className="w-5 h-5" />
                  Sync Now
                </>
              )}
            </button>

            <button
              onClick={handleDisconnect}
              className="flex-1 border border-red-600 text-red-600 font-heading py-3 uppercase tracking-wider hover:bg-red-600 hover:text-iron-white transition-colors flex items-center justify-center gap-2"
            >
              <Unlink className="w-5 h-5" />
              Disconnect
            </button>
          </div>

          <p className="text-iron-gray text-xs">
            Your Garmin activities are synced automatically to track your cardio and endurance training
          </p>
        </div>
      )}
    </div>
  );
}