import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UserGoalInsert, GoalType, isValidGoalType } from '@/types/profile';

// Validation helpers
function validateGoalData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.goal_type || !isValidGoalType(data.goal_type)) {
    errors.push('Invalid or missing goal type');
  }

  if (!data.description || data.description.trim().length < 10) {
    errors.push('Goal description must be at least 10 characters');
  }

  if (data.description && data.description.length > 500) {
    errors.push('Goal description too long (max 500 characters)');
  }

  if (data.target_value !== undefined && data.target_value <= 0) {
    errors.push('Target value must be positive');
  }

  if (data.target_date && new Date(data.target_date) <= new Date()) {
    errors.push('Target date must be in the future');
  }

  if (data.priority !== undefined && (data.priority < 1 || data.priority > 5)) {
    errors.push('Priority must be between 1 and 5');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function sanitizeGoalData(data: any): UserGoalInsert {
  return {
    goal_type: data.goal_type,
    description: String(data.description || '').replace(/<[^>]*>/g, '').trim(),
    target_value: data.target_value ? parseFloat(data.target_value) : null,
    target_unit: data.target_unit ? String(data.target_unit).replace(/<[^>]*>/g, '').trim() : null,
    target_date: data.target_date || null,
    priority: data.priority ? parseInt(data.priority) : undefined,
    status: data.status || 'active'
  };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let query = supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'archived') {
      query = query.eq('is_active', false);
    } else if (status === 'completed') {
      query = query.eq('status', 'completed');
    }

    const { data: goals, error: goalsError } = await query;

    if (goalsError) {
      throw goalsError;
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('user_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      throw countError;
    }

    // Calculate progress for each goal (if needed)
    const goalsWithProgress = await Promise.all(
      (goals || []).map(async (goal) => {
        // TODO: Implement progress calculation based on goal type
        const progress = calculateGoalProgress(goal);
        return { ...goal, progress };
      })
    );

    return NextResponse.json({
      goals: goalsWithProgress,
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Goals fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    const validation = validateGoalData(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      );
    }

    // Check goal limit (max 5 active goals)
    const { count: activeGoalsCount } = await supabase
      .from('user_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (activeGoalsCount && activeGoalsCount >= 5) {
      return NextResponse.json(
        { error: 'Maximum of 5 active goals allowed' },
        { status: 400 }
      );
    }

    // Sanitize and prepare goal data
    const goalData = sanitizeGoalData(body);

    // Auto-assign priority if not provided
    if (!goalData.priority) {
      goalData.priority = (activeGoalsCount || 0) + 1;
    }

    // Create goal
    const { data: newGoal, error: createError } = await supabase
      .from('user_goals')
      .insert({
        user_id: user.id,
        ...goalData,
        is_active: true
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    // Trigger embedding generation for the goal description
    if (goalData.description) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/profile/embeddings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || ''
          },
          body: JSON.stringify({
            userId: user.id,
            contentType: 'goal',
            content: goalData.description,
            metadata: {
              goalId: newGoal.id,
              goalType: goalData.goal_type
            }
          })
        });
      } catch (err) {
        console.error('Failed to generate goal embedding:', err);
        // Don't fail the request if embedding generation fails
      }
    }

    return NextResponse.json(
      { goal: newGoal },
      { status: 201 }
    );

  } catch (error) {
    console.error('Goal creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateGoalProgress(goal: any): number {
  // This is a simplified progress calculation
  // In a real app, this would be based on user's recorded progress

  if (!goal.target_value || !goal.target_date) {
    return 0;
  }

  const now = new Date();
  const startDate = new Date(goal.created_at);
  const endDate = new Date(goal.target_date);

  const totalDuration = endDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();

  const timeProgress = Math.min(elapsed / totalDuration, 1) * 100;

  // For now, assume progress matches time progress
  // This should be replaced with actual user progress data
  return Math.max(0, Math.min(100, timeProgress));
}