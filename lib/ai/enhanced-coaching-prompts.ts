/**
 * Enhanced Coaching Prompts with Memory System
 * Builds comprehensive system prompts using enhanced context with memory
 */

import { EnhancedUserContext, CompressedContext } from '@/types/memory';
import { ContextCompressor } from './context-compressor';

export async function getEnhancedSystemPrompt(
  context: EnhancedUserContext | CompressedContext
): Promise<string | Array<{type: string; text: string; cache_control?: {type: string}}>> {
  const isCompressed = 'workoutSummary' in context;

  return `You are Wagner, an elite AI fitness coach for the Iron Discipline app. You embody the intense, no-nonsense philosophy of the brand while being supportive and knowledgeable.

CORE DIRECTIVES:
- You are an AI assistant with a knowledge cutoff of April 2024
- You CANNOT access external websites, URLs, or browse the internet
- You can ONLY work with the user data provided in this context
- Use the user's personal information and history to provide tailored advice
- Remember and reference past conversations and established preferences

USER PROFILE:
- Name: ${context.profile?.name || 'User'}
- Primary Goal: ${context.profile?.primaryGoal || context.profile?.goal || 'Not specified'}
- About: ${context.profile?.aboutMe || ''}
- Experience: ${context.profile?.experience || 'Unknown'}
- Member since: ${context.profile?.createdAt ? new Date(context.profile.createdAt).toLocaleDateString() : 'Unknown'}

${isCompressed ? buildCompressedPrompt(context as CompressedContext) : buildFullPrompt(context as EnhancedUserContext)}

COACHING APPROACH:
${buildCoachingApproach(context)}

IMPORTANT REMINDERS:
${buildReminders(context)}

When providing advice:
1. Reference specific data from the user's history
2. Acknowledge their preferences and constraints
3. Build on previous conversations and commitments
4. Track progress toward their stated goals
5. Adapt your tone based on their communication preferences
6. Always prioritize safety given any injuries or constraints`;
}

function buildFullPrompt(context: EnhancedUserContext): string {
  let prompt = '';

  // Memory Facts Section
  if (context.memoryFacts && context.memoryFacts.length > 0) {
    prompt += '\nIMPORTANT USER INFORMATION (Remember these):\n';
    const facts = context.memoryFacts.slice(0, 10);
    for (const fact of facts) {
      if (fact.confidence > 0.7) {
        prompt += `- ${fact.content}${fact.factType === 'constraint' ? ' [IMPORTANT]' : ''}\n`;
      }
    }
  }

  // Preferences
  if (context.preferenceProfile) {
    prompt += '\nUSER PREFERENCES:\n';
    const prefs = context.preferenceProfile;

    if (prefs.workoutPreferences?.preferredTime) {
      prompt += `- Preferred workout time: ${prefs.workoutPreferences.preferredTime}\n`;
    }
    if (prefs.workoutPreferences?.favoriteExercises?.length) {
      prompt += `- Favorite exercises: ${prefs.workoutPreferences.favoriteExercises.join(', ')}\n`;
    }
    if (prefs.workoutPreferences?.avoidedExercises?.length) {
      prompt += `- Exercises to avoid: ${prefs.workoutPreferences.avoidedExercises.join(', ')}\n`;
    }
    if (prefs.nutritionPreferences?.dietaryRestrictions?.length) {
      prompt += `- Dietary restrictions: ${prefs.nutritionPreferences.dietaryRestrictions.join(', ')}\n`;
    }
    if (prefs.nutritionPreferences?.allergies?.length) {
      prompt += `- Allergies: ${prefs.nutritionPreferences.allergies.join(', ')} [CRITICAL]\n`;
    }
  }

  // Constraints
  if (context.preferenceProfile?.constraints) {
    const constraints = context.preferenceProfile.constraints;
    if (constraints.injuries?.length) {
      prompt += '\nINJURIES/LIMITATIONS (Must consider):\n';
      for (const injury of constraints.injuries) {
        prompt += `- ${injury.bodyPart}: ${injury.restrictions.join(', ')}\n`;
      }
    }
  }

  // Recent Workouts
  if (context.recentWorkouts?.length > 0) {
    prompt += '\nRECENT WORKOUTS:\n';
    const recent = context.recentWorkouts.slice(0, 5);
    for (const workout of recent) {
      const date = new Date(workout.completed_at).toLocaleDateString();
      prompt += `- ${workout.workout_name || 'Workout'} (${date}): ${workout.duration_minutes}min`;
      if (workout.performance_rating) prompt += `, Rating: ${workout.performance_rating}/5`;
      if (workout.notes) prompt += `, Notes: ${workout.notes}`;
      prompt += '\n';
    }
  }

  // Workout Patterns
  if (context.workoutPatterns?.length > 0) {
    prompt += '\nWORKOUT PATTERNS:\n';
    const topPatterns = context.workoutPatterns.slice(0, 3);
    for (const pattern of topPatterns) {
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][pattern.dayOfWeek];
      prompt += `- ${day} at ${pattern.hourOfDay}:00 - ${pattern.frequency} times, avg ${Math.round(pattern.avgDuration)}min\n`;
    }
  }

  // Recent Nutrition
  if (context.recentMeals?.length > 0) {
    const today = new Date().toDateString();
    const todaysMeals = context.recentMeals.filter(m =>
      new Date(m.logged_at).toDateString() === today
    );

    if (todaysMeals.length > 0) {
      prompt += '\nTODAY\'S NUTRITION:\n';
      let totalCalories = 0, totalProtein = 0;
      for (const meal of todaysMeals) {
        totalCalories += meal.calories || 0;
        totalProtein += meal.protein_g || 0;
      }
      prompt += `- Meals logged: ${todaysMeals.length}\n`;
      prompt += `- Total calories: ${totalCalories}\n`;
      prompt += `- Total protein: ${totalProtein}g\n`;
    }
  }

  // Nutrition Patterns
  if (context.nutritionPatterns?.length > 0) {
    prompt += '\nNUTRITION PATTERNS:\n';
    for (const pattern of context.nutritionPatterns) {
      prompt += `- ${pattern.mealType}: avg ${Math.round(pattern.avgCalories)} cal, ${Math.round(pattern.avgProtein)}g protein\n`;
    }
  }

  // Long-term Trends
  if (context.longTermTrends) {
    prompt += '\nTRENDS:\n';
    const trends = context.longTermTrends;

    if (trends.workoutFrequencyTrend) {
      prompt += `- Workout frequency: ${trends.workoutFrequencyTrend.direction}`;
      if (trends.workoutFrequencyTrend.changeRate > 0) {
        prompt += ` (${Math.round(trends.workoutFrequencyTrend.changeRate)}% change)`;
      }
      prompt += '\n';
    }

    if (trends.activityConsistency > 0) {
      const consistency = Math.round(trends.activityConsistency * 100);
      prompt += `- Activity consistency: ${consistency}%\n`;
    }
  }

  // Recent Conversation Summaries
  if (context.conversationSummaries?.length > 0) {
    prompt += '\nRECENT CONVERSATIONS:\n';
    for (const summary of context.conversationSummaries.slice(0, 3)) {
      prompt += `- ${new Date(summary.createdAt).toLocaleDateString()}: ${summary.summary}\n`;
      if (summary.actionItems?.length > 0) {
        prompt += `  Action items: ${summary.actionItems.slice(0, 2).join('; ')}\n`;
      }
    }
  }

  // Active Goals
  if (context.goals?.length > 0) {
    prompt += '\nACTIVE GOALS:\n';
    for (const goal of context.goals.filter(g => g.isActive !== false).slice(0, 5)) {
      prompt += `- ${goal.title || goal.description}`;
      if (goal.target_value) prompt += `: ${goal.current_value || 0}/${goal.target_value}`;
      if (goal.target_date) prompt += ` by ${new Date(goal.target_date).toLocaleDateString()}`;
      prompt += '\n';
    }
  }

  return prompt;
}

function buildCompressedPrompt(context: CompressedContext): string {
  let prompt = '';

  // Key facts
  if (context.relevantFacts?.length > 0) {
    prompt += '\nKEY INFORMATION:\n';
    for (const fact of context.relevantFacts.slice(0, 8)) {
      prompt += `- ${fact.content}${fact.factType === 'constraint' ? ' [IMPORTANT]' : ''}\n`;
    }
  }

  // Preferences summary
  if (context.keyPreferences) {
    prompt += '\nPREFERENCES:\n';
    const prefs = context.keyPreferences;

    if (prefs.workoutPreferences?.preferredTime) {
      prompt += `- Workout time: ${prefs.workoutPreferences.preferredTime}\n`;
    }
    if (prefs.constraints?.injuries?.length) {
      prompt += `- Injuries: ${prefs.constraints.injuries.map(i => i.bodyPart).join(', ')}\n`;
    }
    if (prefs.nutritionPreferences?.allergies?.length) {
      prompt += `- Allergies: ${prefs.nutritionPreferences.allergies.join(', ')} [CRITICAL]\n`;
    }
  }

  // Summaries
  if (context.workoutSummary) {
    prompt += '\nWORKOUT SUMMARY:\n' + context.workoutSummary + '\n';
  }

  if (context.nutritionSummary) {
    prompt += '\nNUTRITION SUMMARY:\n' + context.nutritionSummary + '\n';
  }

  if (context.activitySummary) {
    prompt += '\nACTIVITY SUMMARY:\n' + context.activitySummary + '\n';
  }

  // Today's data
  if (context.todaysMeals?.length > 0) {
    prompt += '\nTODAY\'S MEALS:\n';
    let totalCal = 0, totalProtein = 0;
    for (const meal of context.todaysMeals) {
      totalCal += meal.calories || 0;
      totalProtein += meal.protein_g || 0;
    }
    prompt += `- ${context.todaysMeals.length} meals, ${totalCal} cal, ${totalProtein}g protein\n`;
  }

  // Recent workouts (compressed)
  if (context.recentWorkouts?.length > 0) {
    prompt += '\nRECENT WORKOUTS:\n';
    for (const workout of context.recentWorkouts.slice(0, 3)) {
      const date = new Date(workout.completed_at).toLocaleDateString();
      prompt += `- ${workout.workout_name} (${date}): ${workout.duration_minutes}min\n`;
    }
  }

  // Goals
  if (context.currentGoals?.length > 0) {
    prompt += '\nGOALS:\n';
    for (const goal of context.currentGoals.slice(0, 3)) {
      prompt += `- ${goal.title || goal.description}\n`;
    }
  }

  // Trends
  if (context.trends) {
    prompt += '\nTRENDS:\n';
    if (context.trends.workoutFrequencyTrend) {
      prompt += `- Workouts: ${context.trends.workoutFrequencyTrend.direction}\n`;
    }
    if (context.trends.activityConsistency > 0) {
      prompt += `- Consistency: ${Math.round(context.trends.activityConsistency * 100)}%\n`;
    }
  }

  return prompt;
}

function buildCoachingApproach(context: EnhancedUserContext | CompressedContext): string {
  let approach = '- Be direct and motivating\n';

  // Adjust based on preferences
  const prefs = 'preferenceProfile' in context
    ? context.preferenceProfile?.communicationStyle
    : context.keyPreferences?.communicationStyle;

  if (prefs) {
    if (prefs.preferredTone === 'encouraging') {
      approach += '- Use positive reinforcement and celebrate small wins\n';
    } else if (prefs.preferredTone === 'tough_love') {
      approach += '- Be firm and push them to exceed their limits\n';
    } else if (prefs.preferredTone === 'gentle') {
      approach += '- Be supportive and understanding, avoid harsh criticism\n';
    }

    if (prefs.detailLevel === 'concise') {
      approach += '- Keep responses brief and to the point\n';
    } else if (prefs.detailLevel === 'detailed') {
      approach += '- Provide thorough explanations and reasoning\n';
    }
  }

  // Adjust based on recent sentiment
  if ('conversationSummaries' in context && context.conversationSummaries?.length > 0) {
    const recentSentiment = context.conversationSummaries[0].sentiment;
    if (recentSentiment === 'frustrated') {
      approach += '- Be extra supportive, they may be struggling\n';
    } else if (recentSentiment === 'motivated') {
      approach += '- Harness their current motivation with challenging goals\n';
    }
  }

  return approach;
}

function buildReminders(context: EnhancedUserContext | CompressedContext): string {
  const reminders: string[] = [];

  // Check for allergies
  const allergies = 'preferenceProfile' in context
    ? context.preferenceProfile?.nutritionPreferences?.allergies
    : context.keyPreferences?.nutritionPreferences?.allergies;

  if (allergies?.length) {
    reminders.push(`- NEVER recommend foods containing: ${allergies.join(', ')}`);
  }

  // Check for injuries
  const injuries = 'preferenceProfile' in context
    ? context.preferenceProfile?.constraints?.injuries
    : context.keyPreferences?.constraints?.injuries;

  if (injuries?.length) {
    for (const injury of injuries) {
      if (injury.restrictions?.length) {
        reminders.push(`- Avoid exercises involving: ${injury.restrictions.join(', ')} (${injury.bodyPart} injury)`);
      }
    }
  }

  // Check for action items from previous conversations
  if ('conversationSummaries' in context && context.conversationSummaries?.length > 0) {
    const recentActionItems = context.conversationSummaries[0].actionItems;
    if (recentActionItems?.length) {
      reminders.push(`- Follow up on commitments: ${recentActionItems[0]}`);
    }
  }

  return reminders.join('\n') || '- Provide safe, effective guidance';
}

/**
 * Build system prompt with caching support for Gemini/Anthropic
 * Splits stable context (cacheable) from dynamic data
 * Cache saves 70% on token costs for repeated stable content
 */
export async function getCachedSystemPrompt(
  context: EnhancedUserContext | CompressedContext
): Promise<Array<{type: string; text: string; cache_control?: {type: string}}>> {
  const isCompressed = 'workoutSummary' in context;

  // Part 1: Core instructions (stable, cacheable for 3-5 min)
  const coreInstructions = `You are Wagner, an elite AI fitness coach for the Iron Discipline app. You embody the intense, no-nonsense philosophy of the brand while being supportive and knowledgeable.

CORE DIRECTIVES:
- You are an AI assistant with a knowledge cutoff of April 2024
- You CANNOT access external websites, URLs, or browse the internet
- You can ONLY work with the user data provided in this context
- Use the user's personal information and history to provide tailored advice
- Remember and reference past conversations and established preferences`;

  // Part 2: User profile and stable preferences (cacheable)
  let stableContext = `

USER PROFILE:
- Name: ${context.profile?.name || 'User'}
- Primary Goal: ${context.profile?.primaryGoal || context.profile?.goal || 'Not specified'}
- About: ${context.profile?.aboutMe || ''}
- Experience: ${context.profile?.experience || 'Unknown'}
- Member since: ${context.profile?.createdAt ? new Date(context.profile.createdAt).toLocaleDateString() : 'Unknown'}

`;

  stableContext += buildStableContext(context, isCompressed);

  stableContext += `

COACHING APPROACH:
${buildCoachingApproach(context)}

IMPORTANT REMINDERS:
${buildReminders(context)}`;

  // Part 3: Dynamic recent data (NOT cacheable - changes frequently)
  const dynamicContext = buildDynamicContext(context, isCompressed);

  const instructions = `

When providing advice:
1. Reference specific data from the user's history
2. Acknowledge their preferences and constraints
3. Build on previous conversations and commitments
4. Track progress toward their stated goals
5. Adapt your tone based on their communication preferences
6. Always prioritize safety given any injuries or constraints`;

  // Return as structured array with cache control
  // Gemini caches the middle section automatically for 3-5 minutes
  return [
    {
      type: 'text',
      text: coreInstructions,
    },
    {
      type: 'text',
      text: stableContext,
      cache_control: { type: 'ephemeral' }, // Cache user profile, preferences, patterns
    },
    {
      type: 'text',
      text: dynamicContext + instructions, // Recent workouts, meals, trends - NOT cached
    },
  ];
}

// Build stable context parts (preferences, constraints, patterns)
function buildStableContext(context: EnhancedUserContext | CompressedContext, isCompressed: boolean): string {
  if (isCompressed) {
    return buildStableCompressed(context as CompressedContext);
  }
  return buildStableFull(context as EnhancedUserContext);
}

// Build dynamic context parts (recent workouts, meals, trends)
function buildDynamicContext(context: EnhancedUserContext | CompressedContext, isCompressed: boolean): string {
  if (isCompressed) {
    return buildDynamicCompressed(context as CompressedContext);
  }
  return buildDynamicFull(context as EnhancedUserContext);
}

// Stable parts for full context
function buildStableFull(context: EnhancedUserContext): string {
  let prompt = '';

  // Memory facts (stable)
  if (context.memoryFacts?.length > 0) {
    prompt += 'IMPORTANT USER INFORMATION (Remember these):\n';
    const facts = context.memoryFacts.slice(0, 10).filter(f => f.confidence > 0.7);
    for (const fact of facts) {
      prompt += `- ${fact.content}${fact.factType === 'constraint' ? ' [IMPORTANT]' : ''}\n`;
    }
  }

  // Preferences (stable)
  if (context.preferenceProfile) {
    prompt += '\nUSER PREFERENCES:\n';
    const prefs = context.preferenceProfile;
    if (prefs.workoutPreferences?.preferredTime) {
      prompt += `- Preferred workout time: ${prefs.workoutPreferences.preferredTime}\n`;
    }
    if (prefs.workoutPreferences?.favoriteExercises?.length) {
      prompt += `- Favorite exercises: ${prefs.workoutPreferences.favoriteExercises.join(', ')}\n`;
    }
    if (prefs.workoutPreferences?.avoidedExercises?.length) {
      prompt += `- Exercises to avoid: ${prefs.workoutPreferences.avoidedExercises.join(', ')}\n`;
    }
    if (prefs.nutritionPreferences?.dietaryRestrictions?.length) {
      prompt += `- Dietary restrictions: ${prefs.nutritionPreferences.dietaryRestrictions.join(', ')}\n`;
    }
    if (prefs.nutritionPreferences?.allergies?.length) {
      prompt += `- Allergies: ${prefs.nutritionPreferences.allergies.join(', ')} [CRITICAL]\n`;
    }
  }

  // Constraints (stable)
  if (context.preferenceProfile?.constraints?.injuries?.length) {
    prompt += '\nINJURIES/LIMITATIONS (Must consider):\n';
    for (const injury of context.preferenceProfile.constraints.injuries) {
      prompt += `- ${injury.bodyPart}: ${injury.restrictions.join(', ')}\n`;
    }
  }

  // Patterns (relatively stable)
  if (context.workoutPatterns?.length > 0) {
    prompt += '\nWORKOUT PATTERNS:\n';
    for (const pattern of context.workoutPatterns.slice(0, 3)) {
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][pattern.dayOfWeek];
      prompt += `- ${day} at ${pattern.hourOfDay}:00 - ${pattern.frequency} times, avg ${Math.round(pattern.avgDuration)}min\n`;
    }
  }

  if (context.nutritionPatterns?.length > 0) {
    prompt += '\nNUTRITION PATTERNS:\n';
    for (const pattern of context.nutritionPatterns) {
      prompt += `- ${pattern.mealType}: avg ${Math.round(pattern.avgCalories)} cal, ${Math.round(pattern.avgProtein)}g protein\n`;
    }
  }

  // Goals (relatively stable)
  if (context.goals?.length > 0) {
    prompt += '\nACTIVE GOALS:\n';
    for (const goal of context.goals.filter(g => g.isActive !== false).slice(0, 5)) {
      prompt += `- ${goal.title || goal.description}`;
      if (goal.target_value) prompt += `: ${goal.current_value || 0}/${goal.target_value}`;
      if (goal.target_date) prompt += ` by ${new Date(goal.target_date).toLocaleDateString()}`;
      prompt += '\n';
    }
  }

  return prompt;
}

// Dynamic parts for full context
function buildDynamicFull(context: EnhancedUserContext): string {
  let prompt = '';

  // Recent workouts (dynamic)
  if (context.recentWorkouts?.length > 0) {
    prompt += '\nRECENT WORKOUTS:\n';
    for (const workout of context.recentWorkouts.slice(0, 5)) {
      const date = new Date(workout.completed_at).toLocaleDateString();
      prompt += `- ${workout.workout_name || 'Workout'} (${date}): ${workout.duration_minutes}min`;
      if (workout.performance_rating) prompt += `, Rating: ${workout.performance_rating}/5`;
      if (workout.notes) prompt += `, Notes: ${workout.notes}`;
      prompt += '\n';
    }
  }

  // Today's nutrition (dynamic)
  if (context.recentMeals?.length > 0) {
    const today = new Date().toDateString();
    const todaysMeals = context.recentMeals.filter(m => new Date(m.logged_at).toDateString() === today);
    if (todaysMeals.length > 0) {
      prompt += '\nTODAY\'S NUTRITION:\n';
      let totalCalories = 0, totalProtein = 0;
      for (const meal of todaysMeals) {
        totalCalories += meal.calories || 0;
        totalProtein += meal.protein_g || 0;
      }
      prompt += `- Meals logged: ${todaysMeals.length}\n- Total calories: ${totalCalories}\n- Total protein: ${totalProtein}g\n`;
    }
  }

  // Trends (dynamic)
  if (context.longTermTrends) {
    prompt += '\nTRENDS:\n';
    if (context.longTermTrends.workoutFrequencyTrend) {
      prompt += `- Workout frequency: ${context.longTermTrends.workoutFrequencyTrend.direction}`;
      if (context.longTermTrends.workoutFrequencyTrend.changeRate > 0) {
        prompt += ` (${Math.round(context.longTermTrends.workoutFrequencyTrend.changeRate)}% change)`;
      }
      prompt += '\n';
    }
    if (context.longTermTrends.activityConsistency > 0) {
      prompt += `- Activity consistency: ${Math.round(context.longTermTrends.activityConsistency * 100)}%\n`;
    }
  }

  // Recent conversations (dynamic)
  if (context.conversationSummaries?.length > 0) {
    prompt += '\nRECENT CONVERSATIONS:\n';
    for (const summary of context.conversationSummaries.slice(0, 3)) {
      prompt += `- ${new Date(summary.createdAt).toLocaleDateString()}: ${summary.summary}\n`;
      if (summary.actionItems?.length > 0) {
        prompt += `  Action items: ${summary.actionItems.slice(0, 2).join('; ')}\n`;
      }
    }
  }

  return prompt;
}

// Stable parts for compressed context
function buildStableCompressed(context: CompressedContext): string {
  let prompt = '';

  if (context.relevantFacts?.length > 0) {
    prompt += 'KEY INFORMATION:\n';
    for (const fact of context.relevantFacts.slice(0, 8)) {
      prompt += `- ${fact.content}${fact.factType === 'constraint' ? ' [IMPORTANT]' : ''}\n`;
    }
  }

  if (context.keyPreferences) {
    prompt += '\nPREFERENCES:\n';
    if (context.keyPreferences.workoutPreferences?.preferredTime) {
      prompt += `- Workout time: ${context.keyPreferences.workoutPreferences.preferredTime}\n`;
    }
    if (context.keyPreferences.constraints?.injuries?.length) {
      prompt += `- Injuries: ${context.keyPreferences.constraints.injuries.map(i => i.bodyPart).join(', ')}\n`;
    }
    if (context.keyPreferences.nutritionPreferences?.allergies?.length) {
      prompt += `- Allergies: ${context.keyPreferences.nutritionPreferences.allergies.join(', ')} [CRITICAL]\n`;
    }
  }

  if (context.currentGoals?.length > 0) {
    prompt += '\nGOALS:\n';
    for (const goal of context.currentGoals.slice(0, 3)) {
      prompt += `- ${goal.title || goal.description}\n`;
    }
  }

  return prompt;
}

// Dynamic parts for compressed context
function buildDynamicCompressed(context: CompressedContext): string {
  let prompt = '';

  if (context.workoutSummary) prompt += '\nWORKOUT SUMMARY:\n' + context.workoutSummary + '\n';
  if (context.nutritionSummary) prompt += '\nNUTRITION SUMMARY:\n' + context.nutritionSummary + '\n';
  if (context.activitySummary) prompt += '\nACTIVITY SUMMARY:\n' + context.activitySummary + '\n';

  if (context.todaysMeals?.length > 0) {
    prompt += '\nTODAY\'S MEALS:\n';
    let totalCal = 0, totalProtein = 0;
    for (const meal of context.todaysMeals) {
      totalCal += meal.calories || 0;
      totalProtein += meal.protein_g || 0;
    }
    prompt += `- ${context.todaysMeals.length} meals, ${totalCal} cal, ${totalProtein}g protein\n`;
  }

  if (context.recentWorkouts?.length > 0) {
    prompt += '\nRECENT WORKOUTS:\n';
    for (const workout of context.recentWorkouts.slice(0, 3)) {
      const date = new Date(workout.completed_at).toLocaleDateString();
      prompt += `- ${workout.workout_name} (${date}): ${workout.duration_minutes}min\n`;
    }
  }

  if (context.trends) {
    prompt += '\nTRENDS:\n';
    if (context.trends.workoutFrequencyTrend) {
      prompt += `- Workouts: ${context.trends.workoutFrequencyTrend.direction}\n`;
    }
    if (context.trends.activityConsistency > 0) {
      prompt += `- Consistency: ${Math.round(context.trends.activityConsistency * 100)}%\n`;
    }
  }

  return prompt;
}