import { createClient } from '@/lib/supabase/server';
import { UserContext, WorkoutContext, ProgressContext } from '@/lib/types/coaching';
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
    recent: recentWorkouts?.map(w => ({
      id: w.id.toString(),
      name: w.workouts?.name || 'Unknown Workout',
      type: w.workouts?.type || 'general',
      completedAt: new Date(w.completed_at),
      duration: w.duration_minutes || 0,
      exercises: [], // Would need to fetch exercise completions for full detail
      notes: w.notes,
      rating: w.workout_rating
    })) || [],
    favorites: favoriteWorkouts?.map(f => ({
      id: f.workout_id.toString(),
      name: f.workouts?.name || 'Unknown',
      type: f.workouts?.type || 'general',
      completionCount: 0, // Would need to count completions
      averageRating: 0
    })) || [],
    stats: workoutStats,
    patterns: detectWorkoutPatterns(recentWorkouts || [])
  };

  // Build progress context
  const progressContext: ProgressContext = {
    milestones: detectMilestones(personalRecords || []),
    trends: progressTrends,
    personalRecords: personalRecords?.map(pr => ({
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
      goal: profile?.goal || 'build_muscle',
      experience: determineExperience(workoutStats, personalRecords?.length || 0),
      preferences: {
        workoutDays: [],
        equipment: [],
      },
      createdAt: profile?.created_at ? new Date(profile.created_at) : new Date()
    },
    workouts: workoutContext,
    progress: progressContext,
    conversations: {
      topics: conversationTopics,
      lastInteraction: conversations?.[0]?.updated_at
        ? new Date(conversations[0].updated_at)
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

interface WorkoutPattern {
  type: string;
  pattern: string;
  confidence: number;
}

function detectWorkoutPatterns(workouts: WorkoutCompletionRecord[]): WorkoutPattern[] {
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
      type: 'split',
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
        type: 'frequency',
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

function detectMilestones(personalRecords: PersonalRecordRow[]): Milestone[] {
  return personalRecords.slice(0, 5).map(pr => ({
    type: 'personal_record',
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

function calculateAverageConversationLength(conversations: ConversationRecord[]): number {
  if (conversations.length === 0) return 0;

  const totalMessages = conversations.reduce((sum, conv) => {
    return sum + (conv.messages?.length || 0);
  }, 0);

  return Math.round(totalMessages / conversations.length);
}