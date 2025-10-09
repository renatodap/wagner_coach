'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MergeRequestCard } from '@/components/MergeRequestCard';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getPendingMergeRequests,
  approveMergeRequest,
  rejectMergeRequest,
  type MergeRequest
} from '@/lib/api/merge-requests';

export default function MergeRequestsPage() {
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    loadMergeRequests();
  }, []);

  async function loadMergeRequests() {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const requests = await getPendingMergeRequests(session.access_token);
      setMergeRequests(requests);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load merge requests';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleApprove(mergeRequestId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      await approveMergeRequest(session.access_token, mergeRequestId);

      // Remove from list
      setMergeRequests(prev => prev.filter(r => r.id !== mergeRequestId));

      toast({
        title: 'Merge Approved',
        description: 'Duplicate activity has been merged and hidden.',
        variant: 'default',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve merge';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }

  async function handleReject(mergeRequestId: string) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      await rejectMergeRequest(session.access_token, mergeRequestId);

      // Remove from list
      setMergeRequests(prev => prev.filter(r => r.id !== mergeRequestId));

      toast({
        title: 'Merge Rejected',
        description: 'Both activities will remain in your activity list.',
        variant: 'default',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject merge';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading merge requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <Activity className="h-12 w-12 mx-auto mb-2" />
              <h3 className="text-lg font-semibold">Error Loading Merge Requests</h3>
              <p className="text-sm mt-2">{error}</p>
            </div>
            <button
              onClick={loadMergeRequests}
              className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Duplicate Activities
          </h1>
          <p className="text-gray-600">
            Review and merge duplicate activities from multiple sources
          </p>
        </div>

        {/* Merge Requests List */}
        {mergeRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center">
                <div className="p-4 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  All Clear!
                </h3>
                <p className="text-gray-600 max-w-md">
                  No duplicate activities detected. Your activity feed is clean and organized.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {mergeRequests.length} {mergeRequests.length === 1 ? 'duplicate' : 'duplicates'} detected
              </p>
            </div>

            <div className="space-y-6">
              {mergeRequests.map((request) => (
                <MergeRequestCard
                  key={request.id}
                  mergeRequest={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          </>
        )}

        {/* Help Text */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            How Duplicate Detection Works
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Activities within 30 minutes are compared</li>
            <li>• Multiple signals are used: time, duration, distance, heart rate, calories</li>
            <li>• Confidence score shows match likelihood (80-100% shown here)</li>
            <li>• Very high confidence duplicates (95%+) are auto-merged</li>
            <li>• You can always view merged activities in your history</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
