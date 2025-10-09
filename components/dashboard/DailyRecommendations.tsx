"use client"

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Utensils,
  Dumbbell,
  Clock,
  CheckCircle2,
  X,
  Loader2,
  RefreshCw,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import {
  getTodaysRecommendations,
  getNextRecommendation,
  acceptRecommendation,
  rejectRecommendation,
  getRecommendationIcon,
  getRecommendationColor,
  formatTimeUntil
} from '@/lib/api/consultation';
import type { Recommendation, NextAction } from '@/types/consultation';

interface DailyRecommendationsProps {
  userId?: string;
  maxRecommendations?: number;
  showAcceptReject?: boolean;
  showNextAction?: boolean;
}

export function DailyRecommendations({
  userId,
  maxRecommendations = 5,
  showAcceptReject = true,
  showNextAction = true
}: DailyRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [nextAction, setNextAction] = useState<NextAction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    try {
      setIsLoading(true);
      setError(null);

      const [todayData, nextData] = await Promise.all([
        getTodaysRecommendations(),
        showNextAction ? getNextRecommendation() : Promise.resolve(null)
      ]);

      // Filter to pending and accepted only
      const activeRecs = todayData.recommendations
        .filter(r => r.status === 'pending' || r.status === 'accepted')
        .slice(0, maxRecommendations);

      setRecommendations(activeRecs);
      setNextAction(nextData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load recommendations';
      setError(message);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAccept(recommendationId: string) {
    setProcessingId(recommendationId);
    try {
      await acceptRecommendation(recommendationId);

      // Update local state
      setRecommendations(recs =>
        recs.map(r => r.id === recommendationId ? { ...r, status: 'accepted' as const } : r)
      );

      toast({
        title: 'Accepted!',
        description: 'Recommendation added to your plan',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to accept recommendation',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(recommendationId: string) {
    setProcessingId(recommendationId);
    try {
      await rejectRecommendation(recommendationId);

      // Remove from local state
      setRecommendations(recs => recs.filter(r => r.id !== recommendationId));

      toast({
        title: 'Rejected',
        description: 'We\'ll suggest something different',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to reject recommendation',
        variant: 'destructive'
      });
    } finally {
      setProcessingId(null);
    }
  }

  function renderMealRecommendation(rec: Recommendation) {
    const content = rec.content as any;
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">{content.meal_name || 'Meal Suggestion'}</h4>
        {content.foods && content.foods.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {content.foods.map((food: string, idx: number) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {food}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-4 text-sm text-gray-600">
          {content.estimated_calories && (
            <span>{content.estimated_calories} cal</span>
          )}
          {content.estimated_protein_g && (
            <span>{content.estimated_protein_g}g protein</span>
          )}
        </div>
        {content.preparation && (
          <p className="text-sm text-gray-600">{content.preparation}</p>
        )}
      </div>
    );
  }

  function renderWorkoutRecommendation(rec: Recommendation) {
    const content = rec.content as any;
    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900">{content.workout_name || 'Workout'}</h4>
        {content.workout_type && (
          <Badge variant="outline">{content.workout_type}</Badge>
        )}
        {content.duration_minutes && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            {content.duration_minutes} minutes
          </div>
        )}
        {content.note && (
          <p className="text-sm text-gray-600">{content.note}</p>
        )}
      </div>
    );
  }

  function renderRecommendationContent(rec: Recommendation) {
    if (rec.recommendation_type === 'meal') {
      return renderMealRecommendation(rec);
    } else if (rec.recommendation_type === 'workout') {
      return renderWorkoutRecommendation(rec);
    } else {
      // Generic rendering
      const content = rec.content as any;
      return (
        <div className="space-y-2">
          {content.title && (
            <h4 className="font-semibold text-gray-900">{content.title}</h4>
          )}
          {content.description && (
            <p className="text-sm text-gray-600">{content.description}</p>
          )}
        </div>
      );
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          <span className="text-gray-600">Loading recommendations...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <p className="text-gray-900 font-medium">Failed to load recommendations</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <Button
              onClick={loadRecommendations}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (recommendations.length === 0 && !nextAction?.recommendation) {
    return (
      <Card className="p-6 text-center">
        <div className="text-gray-400 mb-3">
          <CheckCircle2 className="h-12 w-12 mx-auto" />
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">All Caught Up!</h3>
        <p className="text-sm text-gray-600">
          No pending recommendations right now. Check back later for suggestions.
        </p>
        <Button
          onClick={loadRecommendations}
          variant="outline"
          size="sm"
          className="mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Today's Recommendations</h3>
        </div>
        <Button
          onClick={loadRecommendations}
          variant="ghost"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Next Action (Priority) */}
      {showNextAction && nextAction?.recommendation && (
        <Card className="p-4 border-2 border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <div className="text-2xl">
              {getRecommendationIcon(nextAction.recommendation.recommendation_type)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-600 text-white">Up Next</Badge>
                {nextAction.time_until_next !== null && nextAction.time_until_next !== undefined && (
                  <span className="text-sm text-blue-700">
                    {nextAction.time_until_next > 0
                      ? `in ${formatTimeUntil(nextAction.time_until_next)}`
                      : 'now'}
                  </span>
                )}
              </div>
              {renderRecommendationContent(nextAction.recommendation)}

              {showAcceptReject && nextAction.recommendation.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => handleAccept(nextAction.recommendation!.id)}
                    disabled={processingId === nextAction.recommendation!.id}
                    size="sm"
                    className="flex-1"
                  >
                    {processingId === nextAction.recommendation!.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleReject(nextAction.recommendation!.id)}
                    disabled={processingId === nextAction.recommendation!.id}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    {processingId === nextAction.recommendation!.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Skip
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Other Recommendations */}
      {recommendations
        .filter(r => !nextAction?.recommendation || r.id !== nextAction.recommendation.id)
        .map((rec) => {
          const colorClasses = getRecommendationColor(rec.recommendation_type);
          const isProcessing = processingId === rec.id;

          return (
            <Card key={rec.id} className={`p-4 border ${colorClasses}`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getRecommendationIcon(rec.recommendation_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={colorClasses}>
                      {rec.recommendation_type.replace('_', ' ')}
                    </Badge>
                    {rec.recommendation_time && (
                      <span className="text-sm text-gray-500">
                        {new Date(`2000-01-01T${rec.recommendation_time}`).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                    {rec.status === 'accepted' && (
                      <Badge variant="success" className="text-xs">
                        Accepted
                      </Badge>
                    )}
                  </div>

                  {renderRecommendationContent(rec)}

                  {rec.reasoning && (
                    <p className="text-xs text-gray-500 mt-2 italic">
                      {rec.reasoning}
                    </p>
                  )}

                  {showAcceptReject && rec.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        onClick={() => handleAccept(rec.id)}
                        disabled={isProcessing}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleReject(rec.id)}
                        disabled={isProcessing}
                        variant="ghost"
                        size="sm"
                      >
                        {isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
    </div>
  );
}
