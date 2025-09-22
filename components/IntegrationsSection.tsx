'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  LinkIcon,
  Activity,
  Loader2,
  Check,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IntegrationsSection() {
  const supabase = createClient();

  const [stravaConnected, setStravaConnected] = useState(false);
  const [garminConnected, setGarminConnected] = useState(false);
  const [stravaSyncing, setStravaSyncing] = useState(false);
  const [garminSyncing, setGarminSyncing] = useState(false);
  const [showGarminForm, setShowGarminForm] = useState(false);
  const [garminCredentials, setGarminCredentials] = useState({ email: '', password: '' });
  const [connectionError, setConnectionError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      setIsLoading(true);

      // Check Strava connection
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: stravaConnection } = await supabase
          .from('strava_connections')
          .select('*')
          .eq('user_id', user.id)
          .single();

        setStravaConnected(!!stravaConnection);

        // Check Garmin connection
        const garminResponse = await fetch('/api/connections/garmin');
        if (garminResponse.ok) {
          const garminData = await garminResponse.json();
          setGarminConnected(garminData.connected);
        }
      }
    } catch (error) {
      console.error('Error checking connections:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectStrava = () => {
    const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID;
    const redirectUri = `${window.location.origin}/api/strava/callback`;
    const scope = 'read,activity:read,activity:read_all';
    const state = 'strava_connect';

    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&state=${state}`;
    window.location.href = authUrl;
  };

  const disconnectStrava = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('strava_connections')
          .delete()
          .eq('user_id', user.id);

        setStravaConnected(false);
      }
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
    }
  };

  const syncStrava = async () => {
    try {
      setStravaSyncing(true);
      const response = await fetch('/api/strava/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'strava' })
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const data = await response.json();
      alert(`Synced ${data.syncedCount || 0} activities from Strava`);
    } catch (error) {
      console.error('Strava sync error:', error);
      alert('Failed to sync Strava activities');
    } finally {
      setStravaSyncing(false);
    }
  };

  const connectGarmin = async () => {
    try {
      setConnectionError('');

      // Use backend URL from environment or fallback to local
      const backendUrl = (process.env.NEXT_PUBLIC_GARMIN_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

      console.log('Testing Garmin connection...');

      const response = await fetch(`${backendUrl}/api/garmin/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(garminCredentials)
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse specific error types
        if (data.details?.includes('401') || data.details?.includes('Unauthorized')) {
          setConnectionError('Invalid Garmin credentials. Please check your email and password.');
        } else if (data.details?.includes('429') || data.details?.includes('Too Many Requests')) {
          setConnectionError('Too many attempts. Please wait a few minutes and try again.');
        } else if (data.details?.includes('Garmin API not available')) {
          setConnectionError('Garmin sync service is not running. Please ensure the Python API is active.');
        } else {
          setConnectionError(data.error || 'Failed to connect to Garmin');
        }
        console.error('Garmin connection failed:', data);
        return;
      }

      setGarminConnected(true);
      setShowGarminForm(false);
      setGarminCredentials({ email: '', password: '' });
      alert('Successfully connected to Garmin! You can now sync your activities.');
    } catch (error) {
      console.error('Garmin connection error:', error);
      setConnectionError('Network error. Please check your connection and try again.');
    }
  };

  const disconnectGarmin = async () => {
    try {
      const response = await fetch('/api/connections/garmin', {
        method: 'DELETE'
      });

      if (response.ok) {
        setGarminConnected(false);
      }
    } catch (error) {
      console.error('Error disconnecting Garmin:', error);
    }
  };

  const syncGarmin = async () => {
    try {
      setGarminSyncing(true);

      // Get stored credentials from local storage or state
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in first');
        return;
      }

      // Use backend URL from environment or fallback to local
      const backendUrl = (process.env.NEXT_PUBLIC_GARMIN_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '');

      const response = await fetch(`${backendUrl}/api/garmin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: garminCredentials.email || 'stored_email', // You should store this after successful connection
          password: garminCredentials.password || 'stored_password', // You should store this securely
          days_back: 30
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || 'Failed to sync Garmin activities');
        return;
      }

      const syncData = await response.json();
      alert(`Successfully synced ${syncData.count} activities from Garmin`);

      // TODO: Save activities to Supabase here
      // You'll need to create an endpoint to save the activities

      // Refresh the page to show new activities
      window.location.reload();

    } catch (error) {
      console.error('Garmin sync error:', error);
      alert('Failed to sync Garmin activities. Make sure the backend service is running.');
    } finally {
      setGarminSyncing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="border border-iron-gray p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-iron-orange" />
        </div>
      </div>
    );
  }

  return (
    <div className="border border-iron-gray p-6">
      <h3 className="font-heading text-xl text-iron-white mb-4 flex items-center gap-2">
        <LinkIcon className="w-5 h-5 text-iron-orange" />
        ACTIVITY SYNC
      </h3>

      {/* Strava Integration */}
      <div className="mb-4 p-4 border border-iron-gray rounded">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-orange-500" />
            <div>
              <p className="text-iron-white font-medium">Strava</p>
              <p className="text-xs text-iron-gray">
                {stravaConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {stravaConnected ? (
              <>
                <Button
                  onClick={syncStrava}
                  disabled={stravaSyncing}
                  size="sm"
                  className="bg-iron-orange hover:bg-orange-600"
                >
                  {stravaSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Sync</span>
                </Button>
                <Button
                  onClick={disconnectStrava}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={connectStrava}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
              >
                Connect
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Garmin Integration */}
      <div className="p-4 border border-iron-gray rounded">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-500" />
            <div>
              <p className="text-iron-white font-medium">Garmin Connect</p>
              <p className="text-xs text-iron-gray">
                {garminConnected ? 'Connected' : 'Not connected'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {garminConnected ? (
              <>
                <Button
                  onClick={syncGarmin}
                  disabled={garminSyncing}
                  size="sm"
                  className="bg-iron-orange hover:bg-orange-600"
                >
                  {garminSyncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Sync</span>
                </Button>
                <Button
                  onClick={disconnectGarmin}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setShowGarminForm(!showGarminForm)}
                size="sm"
                className="bg-blue-500 hover:bg-blue-600"
              >
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Garmin Connection Form */}
        {showGarminForm && !garminConnected && (
          <div className="mt-4 p-4 bg-iron-gray/10 rounded">
            <p className="text-sm text-iron-gray mb-3">
              Enter your Garmin Connect credentials to sync activities:
            </p>
            {connectionError && (
              <div className="mb-3 p-2 bg-red-900/20 border border-red-500/50 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-red-400">{connectionError}</p>
              </div>
            )}
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Garmin email"
                value={garminCredentials.email}
                onChange={(e) => setGarminCredentials({ ...garminCredentials, email: e.target.value })}
                className="w-full bg-iron-black border border-iron-gray px-3 py-2 rounded text-iron-white text-sm"
              />
              <input
                type="password"
                placeholder="Garmin password"
                value={garminCredentials.password}
                onChange={(e) => setGarminCredentials({ ...garminCredentials, password: e.target.value })}
                className="w-full bg-iron-black border border-iron-gray px-3 py-2 rounded text-iron-white text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={connectGarmin}
                  disabled={!garminCredentials.email || !garminCredentials.password}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Connect
                </Button>
                <Button
                  onClick={() => {
                    setShowGarminForm(false);
                    setConnectionError('');
                    setGarminCredentials({ email: '', password: '' });
                  }}
                  size="sm"
                  variant="ghost"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-iron-gray mt-4">
        Activities are automatically deduplicated when syncing from multiple sources.
      </p>
    </div>
  );
}