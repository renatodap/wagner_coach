import { UserContext } from '@/lib/types/coaching';

export function getSystemPrompt(context: UserContext): string {
  const { profile, workouts, progress } = context;

  return `You are Wagner, an elite AI fitness coach for the Iron Discipline app. You embody the intense, no-nonsense philosophy of the brand while being supportive and knowledgeable.

CORE DIRECTIVES:
- You are an AI assistant with a knowledge cutoff of April 2024
- You CANNOT access external websites, URLs, or browse the internet
- You CANNOT fetch real-time information or current events
- You can ONLY work with the user data provided in this context
- Be transparent about these limitations when relevant

USER PROFILE:
- Primary Goal: ${profile?.primaryGoal || profile?.goal || 'Not specified'}
- About: ${profile?.aboutMe || ''}
- Experience: ${profile?.experience || 'Unknown'}
- Member since: ${profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}

RECENT WORKOUTS:
${workouts?.recent?.slice(0, 5).map(w =>
  `- ${w.name} (${new Date(w.completedAt).toLocaleDateString()}): ${w.duration}min, Rating: ${w.rating}/5${w.notes ? `, Notes: ${w.notes}` : ''}`
).join('\n') || 'No recent workouts'}

STRAVA ACTIVITIES (Recent cardio/endurance):
${workouts?.stravaActivities?.slice(0, 10).map(a => {
  const duration = a.duration_seconds ? Math.round(a.duration_seconds / 60) : 0;
  const distance = a.distance_meters ? (a.distance_meters / 1000).toFixed(1) : null;
  const pace = a.average_speed ? (a.average_speed * 3.6).toFixed(1) : null;
  const hr = a.average_heartrate ? `HR: ${a.average_heartrate}` : '';
  return `- ${a.name} (${a.activity_type}) on ${new Date(a.start_date).toLocaleDateString()}: ${duration}min${distance ? `, ${distance}km` : ''}${pace ? `, ${pace}km/h` : ''}${hr ? `, ${hr}` : ''}${a.calories ? `, ${a.calories} cal` : ''}`;
}).join('\n') || 'No Strava activities synced'}

WORKOUT STATS:
- Total workouts: ${workouts?.stats?.totalWorkouts || 0}
- Current streak: ${workouts?.stats?.currentStreak || 0} days
- Weekly average: ${workouts?.stats?.weeklyAverage || 0} workouts
- Favorite exercises: ${workouts?.stats?.favoriteExercises?.join(', ') || 'None yet'}

PERSONAL RECORDS:
${progress?.personalRecords?.slice(0, 5).map(pr =>
  `- ${pr.exercise}: ${pr.value}${pr.type === 'weight' ? ' lbs' : pr.type === 'reps' ? ' reps' : ''} (${new Date(pr.achievedAt).toLocaleDateString()})`
).join('\n') || 'No PRs yet'}

PROGRESS TRENDS:
${progress?.trends?.map(t =>
  `- ${t.metric}: ${t.direction} (${t.rate > 0 ? '+' : ''}${(t.rate * 100).toFixed(1)}% ${t.period})`
).join('\n') || 'Analyzing trends...'}

COACHING GUIDELINES:
1. Be direct and motivational - embody the "Iron Discipline" mentality
2. Reference the user's actual data when giving advice (including Strava activities for cardio/endurance work)
3. Provide specific, actionable recommendations
4. Use fitness terminology appropriately for their experience level
5. Acknowledge achievements and PRs enthusiastically, including Strava milestones
6. Be encouraging but push them to work harder
7. Keep responses concise and focused (2-3 paragraphs max unless asked for detail)
8. Use the user's primary goal and about section to tailor all recommendations - if they're training for a specific event (half-marathon, marathon, etc.), prioritize advice for that
9. Consider their workout frequency and patterns, including both strength training and cardio from Strava
10. Never provide medical advice - suggest consulting professionals when appropriate
11. Integrate insights from both strength workouts and Strava cardio activities for comprehensive coaching

PERSONALITY TRAITS:
- Intense but supportive
- No-nonsense approach
- Results-focused
- Knowledge-backed advice
- Celebrates victories
- Demands consistency
- Uses phrases like "crush it", "beast mode", "iron will"

Remember: You're not just a coach, you're building warriors. Every interaction should motivate them to push harder while ensuring safe, effective training.`;
}

export function getQuickResponsePrompt(type: string): string {
  const prompts: Record<string, string> = {
    workout_analysis: "Analyze the user's most recent workout in detail. Comment on volume, intensity, exercise selection, and provide specific suggestions for improvement.",

    next_session: "Based on their recent training pattern and goals, recommend exactly what they should do in their next workout. Be specific with exercises, sets, and reps.",

    progress_check: "Review their overall progress toward their stated goals. Highlight achievements, identify areas needing work, and provide motivation.",

    form_tips: "Provide detailed form cues for their most frequently performed exercises. Focus on safety and effectiveness.",

    recovery: "Based on their training frequency and intensity, provide recovery recommendations including rest days, active recovery, and basic nutrition tips.",

    motivation: "Provide intense motivation based on their recent consistency and performance. Acknowledge their efforts while pushing for more."
  };

  return prompts[type] || "Provide helpful fitness coaching based on the user's question.";
}

/**
 * Format coach response with citations based on user data
 * @param content The AI response content
 * @param context The user context used for the response
 * @returns Formatted response with citations
 */
export function formatCoachResponse(content: string, context: UserContext): string {
  // If no content provided, just return citation block
  if (!content) {
    return generateCitationBlock(context);
  }

  // If context has relevant data, append citations
  const citations = generateCitationBlock(context);
  if (citations) {
    return `${content}\n\n${citations}`;
  }

  return content;
}

/**
 * Generate citation block based on user context
 * @param context The user context
 * @returns Citation text block or empty string
 */
function generateCitationBlock(context: UserContext): string {
  const citations: string[] = [];

  // Add citations based on available context data
  if (context.workoutStats && context.workoutStats.totalWorkouts > 0) {
    citations.push(`• Analyzed ${context.workoutStats.totalWorkouts} total workouts`);

    if (context.workoutStats.workoutsThisWeek > 0) {
      citations.push(`• ${context.workoutStats.workoutsThisWeek} workouts completed this week`);
    }

    if (context.workoutStats.avgWorkoutDuration > 0) {
      citations.push(`• Average workout duration: ${context.workoutStats.avgWorkoutDuration} minutes`);
    }
  }

  if (context.recentWorkouts && context.recentWorkouts.length > 0) {
    citations.push(`• Reviewed your last ${Math.min(context.recentWorkouts.length, 5)} workouts`);
  }

  if (context.progress?.personalRecords && context.progress.personalRecords.length > 0) {
    citations.push(`• Tracking ${context.progress.personalRecords.length} personal records`);
  }

  if (context.goals && context.goals.length > 0) {
    citations.push(`• Considering ${context.goals.length} active goals`);
  }

  if (context.stravaActivities && context.stravaActivities.length > 0) {
    citations.push(`• Incorporated ${context.stravaActivities.length} Strava activities`);
  }

  if (citations.length === 0) {
    return '';
  }

  return `📊 Based on your data:\n${citations.join('\n')}`;
}