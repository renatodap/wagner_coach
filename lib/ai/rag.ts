/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { UserContext, WorkoutContext, ProgressContext, WorkoutPattern } from '@/lib/types/coaching';
import {
  WorkoutCompletionRecord,
  PersonalRecordRow,
  FavoriteWorkoutRow,
  ConversationRecord,
  ProfileRecord
} from '@/lib/types/database';

export async function getUserContext(userId: string, query: string): Promise<UserContext> {
  const supabase = await createClient();

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Fetch recent workouts
  const { data: recentWorkouts } = await supabase
    .from('workout_completions')
    .select(`
      *,
      workouts (
        name,
        type,
        goal,
        difficulty
      )
    `)
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(10);

  // Fetch Strava activities
  const { data: stravaActivities } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .eq('source', 'strava')
    .order('start_date', { ascending: false })
    .limit(20);

  // Fetch personal records
  const { data: personalRecords } = await supabase
    .from('personal_records')
    .select(`
      *,
      exercises (
        name
      )
    `)
    .eq('user_id', userId)
    .order('achieved_date', { ascending: false })
    .limit(10);

  // Fetch favorite workouts
  const { data: favoriteWorkouts } = await supabase
    .from('favorite_workouts')
    .select(`
      *,
      workouts (
        name,
        type
      )
    `)
    .eq('user_id', userId);

  // Calculate workout stats
  const workoutStats = calculateWorkoutStats(recentWorkouts || []);

  // Analyze progress trends
  const progressTrends = analyzeProgressTrends(recentWorkouts || [], personalRecords || []);

  // Search for relevant context using embeddings if available
  let relevantContext: unknown[] = [];
  try {
    const searchResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/embeddings/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        userId,
        limit: 5
      })
    });

    if (searchResponse.ok) {
      const searchResults = await searchResponse.json();
      relevantContext = searchResults.results || [];
    }
  } catch (error) {
    console.error('Error searching embeddings:', error);
  }

  // Build workout context
  const workoutContext: WorkoutContext = {
    recent: (recentWorkouts as any[])?.map(w => ({
      id: w.id.toString(),
      name: w.workouts?.name || 'Unknown Workout',
      type: w.workouts?.type || 'general',
      completedAt: new Date(w.completed_at),
      duration: w.duration_minutes || 0,
      exercises: [], // Would need to fetch exercise completions for full detail
      notes: w.notes,
      rating: w.workout_rating
    })) || [],
    favorites: (favoriteWorkouts as any[])?.map(f => ({
      id: f.workout_id.toString(),
      name: f.workouts?.name || 'Unknown',
      type: f.workouts?.type || 'general',
      completionCount: 0, // Would need to count completions
      averageRating: 0
    })) || [],
    stats: workoutStats,
    patterns: detectWorkoutPatterns(recentWorkouts || []),
    stravaActivities: (stravaActivities as any[])?.map(a => ({
      id: a.id,
      name: a.name,
      activity_type: a.activity_type,
      sport_type: a.sport_type,
      start_date: new Date(a.start_date),
      duration_seconds: a.duration_seconds,
      distance_meters: a.distance_meters,
      elevation_gain: a.elevation_gain,
      average_speed: a.average_speed,
      max_speed: a.max_speed,
      average_heartrate: a.average_heartrate,
      max_heartrate: a.max_heartrate,
      calories: a.calories,
      description: a.description
    })) || []
  };

  // Build progress context
  const progressContext: ProgressContext = {
    milestones: detectMilestones(personalRecords || []),
    trends: progressTrends,
    personalRecords: (personalRecords as any[])?.map(pr => ({
      exercise: pr.exercises?.name || 'Unknown Exercise',
      type: pr.record_type as 'weight' | 'reps' | 'volume' | 'time',
      value: pr.value,
      previousValue: pr.previous_record || undefined,
      achievedAt: new Date(pr.achieved_date)
    })) || []
  };

  // Get conversation context
  const { data: conversations } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  const conversationTopics = extractConversationTopics(conversations || []);

  return {
    userId,
    profile: {
      goal: (profile as any)?.goal || 'build_muscle',
      experience: determineExperience(workoutStats, personalRecords?.length || 0),
      preferences: {
        workoutDays: [],
        equipment: [],
      },
      createdAt: (profile as any)?.created_at ? new Date((profile as any).created_at) : new Date()
    },
    workouts: workoutContext,
    progress: progressContext,
    conversations: {
      topics: conversationTopics,
      lastInteraction: (conversations as any[])?.[0]?.updated_at
        ? new Date((conversations as any[])[0].updated_at)
        : new Date(),
      sessionCount: conversations?.length || 0,
      averageLength: calculateAverageConversationLength(conversations || [])
    }
  };
}

interface WorkoutStats {
  totalWorkouts: number;
  currentStreak: number;
  weeklyAverage: number;
  favoriteExercises: string[];
  strongestLifts: Array<{ exercise: string; oneRepMax: number; lastUpdated: Date }>;
}

function calculateWorkoutStats(workouts: WorkoutCompletionRecord[]): WorkoutStats {
  const totalWorkouts = workouts.length;
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const recentWorkouts = workouts.filter(w =>
    new Date(w.completed_at).getTime() > oneWeekAgo
  );

  // Calculate current streak
  let currentStreak = 0;
  const sortedWorkouts = [...workouts].sort((a, b) =>
    new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime()
  );

  for (let i = 0; i < sortedWorkouts.length; i++) {
    const workoutDate = new Date(sortedWorkouts[i].completed_at);
    const daysSinceWorkout = Math.floor((now - workoutDate.getTime()) / (24 * 60 * 60 * 1000));

    if (daysSinceWorkout <= i + 1) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Find favorite exercises (would need exercise completion data)
  const favoriteExercises: string[] = [];

  // Find strongest lifts (would need to query exercise completions)
  const strongestLifts: Array<{ exercise: string; oneRepMax: number; lastUpdated: Date }> = [];

  return {
    totalWorkouts,
    currentStreak,
    weeklyAverage: recentWorkouts.length,
    favoriteExercises,
    strongestLifts
  };
}

interface ProgressTrendItem {
  metric: 'strength' | 'volume' | 'consistency' | 'endurance';
  direction: 'improving' | 'maintaining' | 'declining';
  rate: number;
  period: string;
}

function analyzeProgressTrends(workouts: WorkoutCompletionRecord[], personalRecords: PersonalRecordRow[]): ProgressTrendItem[] {
  const trends = [];

  // Analyze workout frequency trend
  const frequencyTrend = analyzeFrequencyTrend(workouts);
  if (frequencyTrend) trends.push(frequencyTrend);

  // Analyze strength progression
  const strengthTrend = analyzeStrengthTrend(personalRecords);
  if (strengthTrend) trends.push(strengthTrend);

  // Analyze consistency
  const consistencyTrend = analyzeConsistencyTrend(workouts);
  if (consistencyTrend) trends.push(consistencyTrend);

  return trends;
}

function analyzeFrequencyTrend(workouts: WorkoutCompletionRecord[]): ProgressTrendItem | null {
  if (workouts.length < 2) return null;

  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const fourWeeksAgo = now - 28 * 24 * 60 * 60 * 1000;

  const recentWorkouts = workouts.filter(w =>
    new Date(w.completed_at).getTime() > twoWeeksAgo
  ).length;

  const olderWorkouts = workouts.filter(w => {
    const time = new Date(w.completed_at).getTime();
    return time > fourWeeksAgo && time <= twoWeeksAgo;
  }).length;

  const rate = olderWorkouts > 0 ? (recentWorkouts - olderWorkouts) / olderWorkouts : 0;

  return {
    metric: 'consistency',
    direction: rate > 0 ? 'improving' : rate < 0 ? 'declining' : 'maintaining',
    rate,
    period: '2 weeks'
  };
}

function analyzeStrengthTrend(personalRecords: PersonalRecordRow[]): ProgressTrendItem | null {
  if (personalRecords.length < 2) return null;

  const recentPRs = personalRecords.filter(pr => {
    const daysSince = (Date.now() - new Date(pr.achieved_date).getTime()) / (24 * 60 * 60 * 1000);
    return daysSince <= 30;
  });

  return {
    metric: 'strength',
    direction: recentPRs.length > 0 ? 'improving' : 'maintaining',
    rate: recentPRs.length / 30, // PRs per day
    period: '30 days'
  };
}

function analyzeConsistencyTrend(workouts: WorkoutCompletionRecord[]): ProgressTrendItem | null {
  if (workouts.length < 4) return null;

  const intervals = [];
  for (let i = 1; i < Math.min(workouts.length, 10); i++) {
    const current = new Date(workouts[i - 1].completed_at).getTime();
    const previous = new Date(workouts[i].completed_at).getTime();
    intervals.push((current - previous) / (24 * 60 * 60 * 1000));
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;

  return {
    metric: 'consistency',
    direction: variance < 4 ? 'improving' : variance > 9 ? 'declining' : 'maintaining',
    rate: -variance / 100, // Lower variance is better
    period: 'recent'
  };
}

function detectWorkoutPatterns(workouts: any[]): WorkoutPattern[] {
  const patterns: WorkoutPattern[] = [];

  // Detect workout split pattern
  const types = workouts.map(w => w.workouts?.type).filter(Boolean) as string[];
  const typeFrequency: Record<string, number> = {};

  types.forEach(type => {
    typeFrequency[type] = (typeFrequency[type] || 0) + 1;
  });

  const mostCommonType = Object.entries(typeFrequency)
    .sort(([, a], [, b]) => b - a)[0];

  if (mostCommonType) {
    patterns.push({
      type: 'split' as const,
      pattern: `Primarily ${mostCommonType[0]} workouts`,
      confidence: mostCommonType[1] / types.length
    });
  }

  // Detect frequency pattern
  if (workouts.length >= 4) {
    const daysOfWeek = workouts.map(w =>
      new Date(w.completed_at).getDay()
    );

    const dayFrequency: Record<number, number> = {};
    daysOfWeek.forEach(day => {
      dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    });

    const preferredDays = Object.entries(dayFrequency)
      .filter(([, count]) => count >= 2)
      .map(([day]) => parseInt(day));

    if (preferredDays.length > 0) {
      patterns.push({
        type: 'frequency' as const,
        pattern: `Prefers training on specific days`,
        confidence: 0.7
      });
    }
  }

  return patterns;
}

interface Milestone {
  type: string;
  achievement: string;
  date: Date;
  value: number;
}

function detectMilestones(personalRecords: any[]): Milestone[] {
  return personalRecords.slice(0, 5).map(pr => ({
    type: 'personal_record' as const,
    achievement: `${pr.exercises?.name || 'Exercise'}: ${pr.value}`,
    date: new Date(pr.achieved_date),
    value: pr.value
  }));
}

function determineExperience(stats: WorkoutStats, prCount: number): 'beginner' | 'intermediate' | 'advanced' {
  if (stats.totalWorkouts < 20 || prCount < 3) return 'beginner';
  if (stats.totalWorkouts < 100 || prCount < 10) return 'intermediate';
  return 'advanced';
}

function extractConversationTopics(conversations: ConversationRecord[]): string[] {
  const topics = new Set<string>();

  conversations.forEach(conv => {
    if (conv.messages && Array.isArray(conv.messages)) {
      conv.messages.forEach((msg) => {
        if (msg.content) {
          // Extract topics based on keywords
          if (/bench|chest|push/i.test(msg.content)) topics.add('chest_training');
          if (/squat|leg|lower/i.test(msg.content)) topics.add('leg_training');
          if (/back|pull|row/i.test(msg.content)) topics.add('back_training');
          if (/form|technique/i.test(msg.content)) topics.add('form_technique');
          if (/progress|gain|improve/i.test(msg.content)) topics.add('progress');
          if (/diet|nutrition|eat/i.test(msg.content)) topics.add('nutrition');
          if (/recover|rest|sore/i.test(msg.content)) topics.add('recovery');
        }
      });
    }
  });

  return Array.from(topics);
}

function calculateAverageConversationLength(conversations: any[]): number {
  if (conversations.length === 0) return 0;

  const totalMessages = conversations.reduce((sum, conv) => {
    return sum + (conv.messages?.length || 0);
  }, 0);

  return Math.round(totalMessages / conversations.length);
}

// Enhanced context function that integrates profile and goals
export async function getEnhancedUserContext(userId: string, query: string): Promise<UserContext> {
  const supabase = await createClient();

  try {
    // Get the enhanced AI context with full profile and goals
    const contextResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/context?` +
      new URLSearchParams({
        requestType: 'general',
        query: query,
        includeHistory: 'true'
      })
    );

    if (contextResponse.ok) {
      const contextData = await contextResponse.json();
      const enhancedContext = contextData.context;

      // Get traditional RAG context for workout-specific data
      const traditionalContext = await getUserContext(userId, query);

      // Merge the contexts to provide both profile/goals and workout data
      const mergedContext: UserContext = {
        ...traditionalContext,
        profile: {
          ...traditionalContext.profile,
          goal: enhancedContext.userProfile.basic.primaryGoal || enhancedContext.userProfile.basic.aboutMe || traditionalContext.profile.goal,
          experience: mapExperienceLevel(enhancedContext.userProfile.basic.experience) || traditionalContext.profile.experience,
          preferences: {
            workoutDays: enhancedContext.preferences.activities || traditionalContext.profile.preferences.workoutDays,
            equipment: enhancedContext.capabilities.equipment || traditionalContext.profile.preferences.equipment,
            limitations: enhancedContext.limitations.physical || [],
            motivationFactors: enhancedContext.preferences.motivationFactors || [],
            trainingStyle: enhancedContext.preferences.trainingStyle || null
          },
          aboutMe: enhancedContext.userProfile.basic.aboutMe,
          primaryGoal: enhancedContext.userProfile.basic.primaryGoal,
          focusAreas: enhancedContext.userProfile.basic.focusAreas
        },
        // Add goals context
        goals: enhancedContext.activeGoals.map((goal: any) => ({
          id: goal.id,
          type: goal.type,
          description: goal.description,
          target: goal.target,
          priority: goal.priority,
          progress: goal.progress,
          status: goal.status
        })),
        // Add enhanced capabilities and limitations
        capabilities: enhancedContext.capabilities,
        limitations: enhancedContext.limitations
      };

      return mergedContext;
    }

    // Fallback to traditional context if enhanced context fails
    return await getUserContext(userId, query);

  } catch (error) {
    console.error('Error getting enhanced context:', error);
    // Fallback to traditional context
    return await getUserContext(userId, query);
  }
}

function mapExperienceLevel(level: string | null): 'beginner' | 'intermediate' | 'advanced' {
  switch (level?.toLowerCase()) {
    case 'beginner':
    case 'novice':
      return 'beginner';
    case 'intermediate':
    case 'experienced':
      return 'intermediate';
    case 'advanced':
    case 'expert':
      return 'advanced';
    default:
      return 'beginner';
  }
}