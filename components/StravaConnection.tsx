'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Activity,
  CheckCircle,
  Clock,
  RefreshCw,
  Unlink,
  Watch,
  Smartphone,
  Zap,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface StravaConnectionProps {
  userId?: string;
}

interface StravaConnectionData {
  connected: boolean;
  athlete: {
    firstname: string;
    lastname: string;
    profile: string;
    city?: string;
    state?: string;
    country?: string;
  } | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  syncEnabled: boolean;
}

export default function StravaConnection({ userId }: StravaConnectionProps) {
  const [connection, setConnection] = useState<StravaConnectionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    checkConnection();
  }, [userId]);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('strava_connections')
        .select('athlete_data, connected_at, last_sync_at, sync_enabled')
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        throw error;
      }

      if (data) {
        setConnection({
          connected: true,
          athlete: data.athlete_data,
          connectedAt: data.connected_at,
          lastSyncAt: data.last_sync_at,
          syncEnabled: data.sync_enabled,
        });
      } else {
        setConnection({
          connected: false,
          athlete: null,
          connectedAt: null,
          lastSyncAt: null,
          syncEnabled: false,
        });
      }
    } catch (err) {
      console.error('Failed to check connection:', err);
      setError('Failed to check Strava connection status');
    } finally {
      setIsLoading(false);
    }
  };

  const connectStrava = () => {
    window.location.href = '/api/strava/auth';
  };

  const syncStrava = async () => {
    setIsSyncing(true);
    setError(null);
    setSyncResult(null);

    try {
      const response = await fetch('/api/strava/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 30, perPage: 50 }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSyncResult(`Successfully synced ${data.activities_synced} activities!`);

      // Update last sync time
      await checkConnection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const disconnect = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const response = await fetch('/api/strava/disconnect', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disconnect');
      }

      setConnection({
        connected: false,
        athlete: null,
        connectedAt: null,
        lastSyncAt: null,
        syncEnabled: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-iron-gray p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-iron-orange" />
        </div>
      </div>
    );
  }

  if (!connection?.connected) {
    return (
      <div className="border border-iron-gray p-6">
        <h2 className="font-heading text-2xl text-iron-white mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-iron-orange" />
          ACTIVITY TRACKING
        </h2>

        <div className="space-y-6">
          {/* Marketing Section */}
          <div className="bg-iron-gray/10 border border-iron-gray/50 p-6 rounded">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-orange-500/20 rounded">
                <Zap className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="font-heading text-lg text-iron-white mb-2">
                  CONNECT YOUR FITNESS DEVICES
                </h3>
                <p className="text-iron-gray text-sm leading-relaxed">
                  Automatically sync all your workouts from any fitness tracker or smartphone app.
                  Whether you use an Apple Watch, Garmin, Fitbit, or just your phone - we&apos;ll
                  import everything seamlessly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-iron-black/50 rounded">
                <Watch className="w-5 h-5 text-iron-orange" />
                <div>
                  <div className="text-iron-white text-sm font-medium">Smart Watches</div>
                  <div className="text-iron-gray text-xs">Apple, Garmin, Fitbit</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-iron-black/50 rounded">
                <Smartphone className="w-5 h-5 text-iron-orange" />
                <div>
                  <div className="text-iron-white text-sm font-medium">Phone Apps</div>
                  <div className="text-iron-gray text-xs">Nike Run Club, Strava</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-iron-black/50 rounded">
                <Activity className="w-5 h-5 text-iron-orange" />
                <div>
                  <div className="text-iron-white text-sm font-medium">All Activities</div>
                  <div className="text-iron-gray text-xs">Runs, rides, strength, yoga</div>
                </div>
              </div>
            </div>

            <div className="border-l-2 border-iron-orange pl-4 mb-6">
              <h4 className="text-iron-white font-medium mb-2">What gets synced:</h4>
              <ul className="text-iron-gray text-sm space-y-1">
                <li>• All workout types (strength, cardio, yoga, sports)</li>
                <li>• Heart rate, pace, distance, and duration data</li>
                <li>• Automatic activity recognition and categorization</li>
                <li>• Real-time sync - new workouts appear instantly</li>
              </ul>
            </div>
          </div>

          {/* Strava Connection */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-500 rounded flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-iron-white font-heading text-lg">Connect via Strava</h3>
                <p className="text-iron-gray text-sm">
                  Strava connects to 100+ apps and devices
                </p>
              </div>
            </div>

            <button
              onClick={connectStrava}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 font-heading uppercase tracking-wider transition-colors"
            >
              Connect Strava
            </button>

            <p className="text-iron-gray text-xs mt-3">
              Free • Secure • Connects to Apple Watch, Garmin, Fitbit & more
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-500 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-iron-gray p-6">
      <h2 className="font-heading text-2xl text-iron-white mb-6 flex items-center gap-2">
        <Activity className="w-5 h-5 text-iron-orange" />
        ACTIVITY TRACKING
      </h2>

      <div className="space-y-6">
        {/* Connected Status */}
        <div className="bg-green-900/20 border border-green-500 p-4 rounded">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={connection.athlete?.profile}
                alt="Profile"
                className="w-12 h-12 rounded-full border-2 border-green-500"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-iron-white font-medium">
                    {connection.athlete?.firstname} {connection.athlete?.lastname}
                  </h3>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-green-400 text-sm">
                  Connected via Strava
                  {connection.athlete?.city && connection.athlete?.state && (
                    <span className="text-iron-gray ml-2">
                      • {connection.athlete.city}, {connection.athlete.state}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-iron-gray/10 border border-iron-gray/50 rounded">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-iron-orange" />
              <span className="text-iron-white text-sm font-medium">Last Sync</span>
            </div>
            <p className="text-iron-gray text-sm">
              {connection.lastSyncAt
                ? new Date(connection.lastSyncAt).toLocaleString()
                : 'Never synced'
              }
            </p>
          </div>

          <div className="p-4 bg-iron-gray/10 border border-iron-gray/50 rounded">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-iron-orange" />
              <span className="text-iron-white text-sm font-medium">Auto Sync</span>
            </div>
            <p className="text-iron-gray text-sm">
              {connection.syncEnabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={syncStrava}
            disabled={isSyncing}
            className="flex-1 bg-iron-orange hover:bg-orange-600 text-iron-black px-6 py-3 font-heading uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Sync Now
              </>
            )}
          </button>

          <button
            onClick={disconnect}
            disabled={isDisconnecting}
            className="px-6 py-3 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-heading uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDisconnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Disconnecting...
              </>
            ) : (
              <>
                <Unlink className="w-4 h-4" />
                Disconnect
              </>
            )}
          </button>
        </div>

        {/* Status Messages */}
        {syncResult && (
          <div className="flex items-center gap-2 p-4 bg-green-900/20 border border-green-500 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>{syncResult}</span>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-900/20 border border-red-500 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Section */}
        <div className="border-l-2 border-iron-orange pl-4">
          <h4 className="text-iron-white font-medium mb-2">Automatic Activity Import</h4>
          <p className="text-iron-gray text-sm leading-relaxed">
            All your workouts are automatically synced from any device connected to Strava.
            This includes Apple Watch, Garmin, Fitbit, and any fitness app that uploads to Strava.
            New activities appear in your dashboard within minutes.
          </p>
        </div>
      </div>
    </div>
  );
}