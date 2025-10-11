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

  const [garminConnected, setGarminConnected] = useState(false);
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

      // Check Garmin connection
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const garminResponse = await fetch('/api/activities/garmin');
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

  const connectGarmin = async () => {
    try {
      setConnectionError('');

      console.log('Testing Garmin connection...');

      // Call Next.js API route (which forwards to Python backend with auth)
      const response = await fetch('/api/connections/garmin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(garminCredentials)
      });

      const data = await response.json();

      if (!response.ok) {
        // Parse specific error types
        if (data.detail?.includes('401') || data.detail?.includes('Unauthorized')) {
          setConnectionError('Invalid Garmin credentials. Please check your email and password.');
        } else if (data.detail?.includes('429') || data.detail?.includes('Too Many Requests')) {
          setConnectionError('Too many attempts. Please wait a few minutes and try again.');
        } else if (data.error?.includes('Garmin API not available')) {
          setConnectionError('Garmin sync service is not running. Please ensure the backend is active.');
        } else {
          setConnectionError(data.error || data.detail || 'Failed to connect to Garmin');
        }
        console.error('Garmin connection failed:', data);
        return;
      }

      // Save connection to Supabase integrations table
      const saveResponse = await fetch('/api/connections/garmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: garminCredentials.email,
          password: garminCredentials.password
        })
      });

      if (!saveResponse.ok) {
        const saveError = await saveResponse.json();
        setConnectionError(saveError.error || 'Failed to save Garmin connection');
        return;
      }

      setGarminConnected(true);
      setShowGarminForm(false);
      setGarminCredentials({ email: '', password: '' });
      alert('Successfully connected to Garmin! You can now sync your health data.');
    } catch (error) {
      console.error('Garmin connection error:', error);
      setConnectionError('Network error. Please check your connection and try again.');
    }
  };

  const disconnectGarmin = async () => {
    try {
      const response = await fetch('/api/activities/garmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' })
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

      // Get stored credentials from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please log in first');
        return;
      }

      // Check if Garmin is connected
      const statusResponse = await fetch('/api/connections/garmin');
      if (!statusResponse.ok) {
        alert('Please connect your Garmin account first');
        return;
      }

      const statusData = await statusResponse.json();
      if (!statusData.connected) {
        alert('Please connect your Garmin account first');
        return;
      }

      console.log('Starting Garmin sync (30 days)...');

      // Call Next.js API route (which forwards to Python backend with auth)
      const response = await fetch('/api/connections/garmin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days_back: 30 })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || errorData.detail || 'Failed to sync Garmin data');
        console.error('Garmin sync failed:', errorData);
        return;
      }

      const syncData = await response.json();
      console.log('Garmin sync response:', syncData);

      const totalSynced = syncData.total_synced || 0;
      const totalErrors = syncData.total_errors || 0;

      if (totalSynced === 0 && totalErrors === 0) {
        alert('No new health data found from Garmin');
        return;
      }

      if (totalErrors > 0) {
        alert(`Synced ${totalSynced} records with ${totalErrors} errors. Check console for details.`);
      } else {
        alert(`Successfully synced ${totalSynced} health records from Garmin!`);
      }

      // Refresh the page to show new data
      window.location.reload();

    } catch (error) {
      console.error('Garmin sync error:', error);
      alert('Failed to sync Garmin data. Please try again.');
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