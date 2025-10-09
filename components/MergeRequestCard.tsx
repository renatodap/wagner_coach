'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  Activity,
  Clock,
  MapPin,
  Heart,
  Flame,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import type { MergeRequest } from '@/lib/api/merge-requests';

interface MergeRequestCardProps {
  mergeRequest: MergeRequest;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export function MergeRequestCard({ mergeRequest, onApprove, onReject }: MergeRequestCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { primary, duplicate, confidence_score, merge_reason } = mergeRequest;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(mergeRequest.id);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await onReject(mergeRequest.id);
    } finally {
      setIsRejecting(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 80) return 'text-yellow-600 bg-yellow-100';
    return 'text-orange-600 bg-orange-100';
  };

  const getConfidenceLabel = (score: number) => {
    if (score >= 90) return 'Very High';
    if (score >= 80) return 'High';
    return 'Medium';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}min`;
  };

  const formatDistance = (meters: number | null) => {
    if (!meters) return '-';
    const km = (meters / 1000).toFixed(2);
    return `${km} km`;
  };

  return (
    <Card className="border-2 border-orange-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Potential Duplicate Detected</CardTitle>
              <CardDescription>
                {format(new Date(primary.start_date), 'MMM d, yyyy')} •{' '}
                {primary.type.replace('_', ' ')}
              </CardDescription>
            </div>
          </div>

          <Badge className={getConfidenceColor(confidence_score)}>
            {getConfidenceLabel(confidence_score)} ({confidence_score}%)
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Matching Signals */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-2">Why these match:</p>
          <div className="flex flex-wrap gap-2">
            {merge_reason.time_diff_minutes !== undefined && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {merge_reason.time_diff_minutes}min apart
              </Badge>
            )}
            {merge_reason.duration_diff_pct !== undefined && (
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Duration ±{merge_reason.duration_diff_pct.toFixed(1)}%
              </Badge>
            )}
            {merge_reason.distance_diff_pct !== undefined && (
              <Badge variant="outline" className="text-xs">
                <MapPin className="h-3 w-3 mr-1" />
                Distance ±{merge_reason.distance_diff_pct.toFixed(1)}%
              </Badge>
            )}
            {merge_reason.same_source && (
              <Badge variant="outline" className="text-xs">
                Same Source ({primary.source})
              </Badge>
            )}
          </div>
        </div>

        {/* Activity Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Primary Activity */}
          <div className="space-y-3 p-4 border rounded-lg bg-green-50">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-600 text-white">
                Keep This
              </Badge>
              <Badge variant="outline" className="text-xs">
                {primary.source}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {primary.name || 'Unnamed Activity'}
              </p>
              <p className="text-xs text-gray-600">
                {format(new Date(primary.start_date), 'h:mm a')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatDuration(primary.duration_minutes)}</span>
              </div>

              {primary.distance_meters && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{formatDistance(primary.distance_meters)}</span>
                </div>
              )}

              {primary.calories && (
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="h-4 w-4 text-gray-500" />
                  <span>{primary.calories} cal</span>
                </div>
              )}

              {primary.average_heartrate && (
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-gray-500" />
                  <span>{primary.average_heartrate} bpm avg</span>
                </div>
              )}
            </div>
          </div>

          {/* Duplicate Activity */}
          <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-gray-600 text-white">
                Merge/Hide
              </Badge>
              <Badge variant="outline" className="text-xs">
                {duplicate.source}
              </Badge>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900">
                {duplicate.name || 'Unnamed Activity'}
              </p>
              <p className="text-xs text-gray-600">
                {format(new Date(duplicate.start_date), 'h:mm a')}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>{formatDuration(duplicate.duration_minutes)}</span>
              </div>

              {duplicate.distance_meters && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>{formatDistance(duplicate.distance_meters)}</span>
                </div>
              )}

              {duplicate.calories && (
                <div className="flex items-center gap-2 text-sm">
                  <Flame className="h-4 w-4 text-gray-500" />
                  <span>{duplicate.calories} cal</span>
                </div>
              )}

              {duplicate.average_heartrate && (
                <div className="flex items-center gap-2 text-sm">
                  <Heart className="h-4 w-4 text-gray-500" />
                  <span>{duplicate.average_heartrate} bpm avg</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Approving will keep the left activity and hide the right one from your activity list.
            The hidden activity can still be viewed in your activity history.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleApprove}
            disabled={isApproving || isRejecting}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Approve Merge
              </>
            )}
          </Button>

          <Button
            onClick={handleReject}
            disabled={isApproving || isRejecting}
            variant="outline"
            className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
          >
            {isRejecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Keep Both
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
