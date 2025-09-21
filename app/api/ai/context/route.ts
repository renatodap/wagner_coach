import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface AIContext {
  userProfile: ProfileContext;
  activeGoals: GoalContext[];
  capabilities: CapabilityContext;
  limitations: LimitationContext;
  preferences: PreferenceContext;
  history: HistoryContext;
}

interface ProfileContext {
  basic: {
    name: string;
    age: number | null;
    experience: string | null;
    aboutMe: string | null;
  };
  physical: {
    height: number | null;
    weight: number | null;
    limitations: string[];
  };
  preferences: {
    activities: string[];
    motivation: string[];
    schedule: {
      frequency: string | null;
      duration: string | null;
    };
  };
}

interface GoalContext {
  id: string;
  type: string;
  description: string;
  target: {
    value: number | null;
    unit: string | null;
    date: string | null;
  };
  priority: number;
  progress: number;
  status: string;
}

interface CapabilityContext {
  equipment: string[];
  skillLevel: string;
  timeAvailable: string | null;
  trainingEnvironment: 'home' | 'gym' | 'outdoor' | 'mixed';
}

interface LimitationContext {
  physical: string[];
  time: string | null;
  equipment: string[];
  dietary: string[];
}

interface PreferenceContext {
  activities: string[];
  motivationFactors: string[];
  trainingStyle: string | null;
  nutritionPreferences: string[];
}

interface HistoryContext {
  totalWorkouts: number;
  recentWorkouts: Array<Record<string, unknown>>;
  achievements: Array<Record<string, unknown>>;
  progressTrends: Array<Record<string, unknown>>;
}

interface SimilarityResult {
  id: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
  type: 'profile' | 'goal';
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const requestType = url.searchParams.get('requestType') || 'general';
    const query = url.searchParams.get('query');
    const includeHistory = url.searchParams.get('includeHistory') === 'true';
    const goalFocus = url.searchParams.get('goalFocus');

    // Assemble complete context
    const context = await assembleContext(
      user.id,
      requestType as 'workout' | 'nutrition' | 'general',
      query,
      includeHistory,
      goalFocus
    );

    // Get relevant embeddings if query provided
    let relevantEmbeddings: SimilarityResult[] = [];
    if (query) {
      relevantEmbeddings = await searchSimilarContent(user.id, query, 5);
    }

    return NextResponse.json({
      context,
      relevantEmbeddings,
      assemblyMetadata: {
        profileVersion: context.userProfile.basic.name || 'anonymous',
        goalsCount: context.activeGoals.length,
        contextSize: JSON.stringify(context).length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Context assembly error:', error);
    return NextResponse.json(
      { error: 'Failed to assemble context' },
      { status: 500 }
    );
  }
}

async function assembleContext(
  userId: string,
  requestType: 'workout' | 'nutrition' | 'general',
  query?: string | null,
  includeHistory = false,
  goalFocus?: string | null
): Promise<AIContext> {
  const supabase = createClient();

  // Get profile data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Get active goals
  const { data: goals } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: true });

  // Get workout history for context
  const historyData = {
    totalWorkouts: 0,
    recentWorkouts: [],
    achievements: [],
    progressTrends: []
  };

  if (includeHistory) {
    try {
      const { data: statsData } = await supabase
        .rpc('calculate_user_stats', { user_id: userId });

      if (statsData) {
        historyData.totalWorkouts = statsData.totalWorkouts || 0;
      }

      // Get recent workouts
      const { data: recentWorkouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      historyData.recentWorkouts = recentWorkouts || [];
    } catch (err) {
      console.error('Failed to load history data:', err);
    }
  }

  // Build profile context
  const profileContext: ProfileContext = {
    basic: {
      name: profile?.full_name || 'User',
      age: profile?.age || null,
      experience: profile?.experience_level || null,
      aboutMe: profile?.about_me || null,
      primaryGoal: profile?.primary_goal || null,
      focusAreas: profile?.focus_areas || []
    },
    physical: {
      height: profile?.height || null,
      weight: profile?.weight || null,
      limitations: profile?.physical_limitations || []
    },
    preferences: {
      activities: profile?.preferred_activities || [],
      motivation: profile?.motivation_factors || [],
      schedule: {
        frequency: profile?.training_frequency || null,
        duration: profile?.session_duration || null
      }
    }
  };

  // Build goals context
  const goalsContext: GoalContext[] = (goals || []).map(goal => ({
    id: goal.id,
    type: goal.goal_type,
    description: goal.goal_description,
    target: {
      value: goal.target_value,
      unit: goal.target_unit,
      date: goal.target_date
    },
    priority: goal.priority,
    progress: calculateGoalProgress(goal),
    status: goal.status || 'active'
  }));

  // Filter goals if specific focus requested
  const activeGoals = goalFocus
    ? goalsContext.filter(goal => goal.id === goalFocus)
    : goalsContext;

  // Build capabilities context
  const capabilities: CapabilityContext = {
    equipment: profile?.available_equipment || [],
    skillLevel: profile?.experience_level || 'beginner',
    timeAvailable: profile?.session_duration || null,
    trainingEnvironment: determineTrainingEnvironment(profile?.available_equipment || [])
  };

  // Build limitations context
  const limitations: LimitationContext = {
    physical: profile?.physical_limitations || [],
    time: profile?.session_duration || null,
    equipment: profile?.available_equipment?.includes('bodyweight') ? ['limited_equipment'] : [],
    dietary: profile?.dietary_preferences || []
  };

  // Build preferences context
  const preferences: PreferenceContext = {
    activities: profile?.preferred_activities || [],
    motivationFactors: profile?.motivation_factors || [],
    trainingStyle: determineTrainingStyle(profile?.preferred_activities || []),
    nutritionPreferences: profile?.dietary_preferences || []
  };

  return {
    userProfile: profileContext,
    activeGoals,
    capabilities,
    limitations,
    preferences,
    history: historyData
  };
}

async function searchSimilarContent(
  userId: string,
  query: string,
  limit: number
): Promise<SimilarityResult[]> {
  const supabase = createClient();

  try {
    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    if (!queryEmbedding) {
      console.warn('Failed to generate query embedding, falling back to text search');
      return await fallbackTextSearch(userId, query, limit);
    }

    // Search profile embeddings using vector similarity
    const { data: profileMatches, error: profileError } = await supabase
      .rpc('match_profile_embeddings', {
        query_embedding: queryEmbedding,
        match_user_id: userId,
        match_threshold: 0.7,
        match_count: Math.ceil(limit / 2)
      });

    if (profileError) {
      console.error('Profile embedding search error:', profileError);
    }

    // Search goal embeddings using vector similarity
    const { data: goalMatches, error: goalError } = await supabase
      .rpc('match_goal_embeddings', {
        query_embedding: queryEmbedding,
        match_user_id: userId,
        match_threshold: 0.7,
        match_count: Math.ceil(limit / 2)
      });

    if (goalError) {
      console.error('Goal embedding search error:', goalError);
    }

    const results: SimilarityResult[] = [];

    // Process profile matches
    if (profileMatches) {
      profileMatches.forEach((match: Record<string, any>) => {
        results.push({
          id: match.id,
          content: `Profile: ${match.metadata?.source_field || 'profile data'}`,
          similarity: match.similarity,
          metadata: match.metadata,
          type: 'profile'
        });
      });
    }

    // Process goal matches
    if (goalMatches) {
      goalMatches.forEach((match: Record<string, any>) => {
        results.push({
          id: match.id,
          content: `Goal: ${match.metadata?.goal_type || 'fitness goal'}`,
          similarity: match.similarity,
          metadata: match.metadata,
          type: 'goal'
        });
      });
    }

    // Sort by similarity and limit results
    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

  } catch (error) {
    console.error('Vector search error:', error);
    return await fallbackTextSearch(userId, query, limit);
  }
}

async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/embeddings/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: query
      })
    });

    if (!response.ok) {
      throw new Error('Failed to generate query embedding');
    }

    const data = await response.json();
    return data.embedding;

  } catch (error) {
    console.error('Query embedding generation error:', error);
    return null;
  }
}

async function fallbackTextSearch(
  userId: string,
  query: string,
  limit: number
): Promise<SimilarityResult[]> {
  const supabase = createClient();
  const results: SimilarityResult[] = [];

  try {
    // Simple text search in profile embeddings metadata
    const { data: profileEmbeddings } = await supabase
      .from('profile_embeddings')
      .select('*')
      .eq('user_id', userId);

    // Simple text search in goal embeddings metadata
    const { data: goalEmbeddings } = await supabase
      .from('goal_embeddings')
      .select('*')
      .eq('user_id', userId);

    const queryLower = query.toLowerCase();

    // Search profile data
    if (profileEmbeddings) {
      profileEmbeddings.forEach(embedding => {
        const sourceField = embedding.metadata?.source_field || '';
        if (sourceField.toLowerCase().includes(queryLower)) {
          results.push({
            id: embedding.id,
            content: `Profile: ${sourceField}`,
            similarity: 0.6, // Lower similarity for text search
            metadata: embedding.metadata,
            type: 'profile'
          });
        }
      });
    }

    // Search goal data
    if (goalEmbeddings) {
      goalEmbeddings.forEach(embedding => {
        const goalType = embedding.metadata?.goal_type || '';
        if (goalType.toLowerCase().includes(queryLower)) {
          results.push({
            id: embedding.id,
            content: `Goal: ${goalType}`,
            similarity: 0.6, // Lower similarity for text search
            metadata: embedding.metadata,
            type: 'goal'
          });
        }
      });
    }

    return results.slice(0, limit);

  } catch (error) {
    console.error('Fallback text search error:', error);
    return [];
  }
}

function calculateGoalProgress(goal: Record<string, any>): number {
  // Simple progress calculation based on time
  if (!goal.target_date) return 0;

  const now = new Date();
  const startDate = new Date(goal.created_at);
  const endDate = new Date(goal.target_date);

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();

  const timeProgress = Math.min(elapsed / totalDuration, 1) * 100;
  return Math.max(0, Math.min(100, timeProgress));
}

function determineTrainingEnvironment(equipment: string[]): 'home' | 'gym' | 'outdoor' | 'mixed' {
  if (equipment.includes('bodyweight') || equipment.length === 0) {
    return 'home';
  }

  const gymEquipment = ['barbell', 'weight_machines', 'cable_machine'];
  const homeEquipment = ['dumbbells', 'resistance_bands', 'yoga_mat'];

  const hasGymEquipment = equipment.some(item => gymEquipment.includes(item));
  const hasHomeEquipment = equipment.some(item => homeEquipment.includes(item));

  if (hasGymEquipment && hasHomeEquipment) return 'mixed';
  if (hasGymEquipment) return 'gym';
  return 'home';
}

function determineTrainingStyle(activities: string[]): string | null {
  if (activities.includes('weightlifting') || activities.includes('crossfit')) {
    return 'strength_focused';
  }
  if (activities.includes('running') || activities.includes('cycling')) {
    return 'cardio_focused';
  }
  if (activities.includes('yoga') || activities.includes('pilates')) {
    return 'flexibility_focused';
  }
  return null;
}