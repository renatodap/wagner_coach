/**
 * Coaching Frameworks and Assessment Criteria
 * Used to provide expert, actionable coaching responses
 */

export interface CoachingFramework {
  goal: string;
  assessmentCriteria: AssessmentCriteria;
  responseTemplate: string;
}

export interface AssessmentCriteria {
  weeklyVolume: { min: number; optimal: number; max: number; unit: string };
  frequency: { min: number; optimal: number; max: number; unit: string };
  keyWorkouts: string[];
  redFlags: string[];
  progressionRate: { safe: number; aggressive: number; unit: string };
}

// Half Marathon Training Framework
export const HALF_MARATHON_FRAMEWORK: CoachingFramework = {
  goal: 'half marathon',
  assessmentCriteria: {
    weeklyVolume: { min: 25, optimal: 40, max: 65, unit: 'km' },
    frequency: { min: 3, optimal: 4, max: 6, unit: 'runs/week' },
    keyWorkouts: [
      'Long run (14-18km)',
      'Tempo run (8-10km at threshold)',
      'Interval/speed work',
      'Easy recovery runs'
    ],
    redFlags: [
      'No long runs over 10km',
      'All runs same pace (no variety)',
      'Running 7 days/week (overtraining)',
      'Increasing volume >10%/week',
      'Skipping rest days'
    ],
    progressionRate: { safe: 10, aggressive: 15, unit: '% per week' }
  },
  responseTemplate: `HALF MARATHON ASSESSMENT:

VOLUME CHECK:
- Current: [X]km/week
- Target: 35-50km/week for solid half prep
- Status: [GOOD/BELOW/ABOVE]

FREQUENCY CHECK:
- Current: [X] runs/week
- Target: 4-5 runs/week
- Status: [GOOD/NEED MORE/TOO MUCH]

KEY WORKOUTS:
- Long run: [YES/NO/TOO SHORT]
- Speed work: [YES/NO]
- Tempo runs: [YES/NO]
- Easy runs: [YES/NO]

CROSS-TRAINING:
- Tennis: [X]x/week - [GOOD for fitness BUT doesn't replace running]
- Strength: [X]x/week - [ESSENTIAL for injury prevention]

GAPS:
[List specific missing elements]

ACTION PLAN - NEXT WEEK:
Monday: [specific workout]
Tuesday: [specific workout]
Wednesday: [specific workout]
Thursday: [specific workout]
Friday: [specific workout]
Weekend: [specific workout]

BOTTOM LINE:
[Brutally honest assessment + specific fix]`
};

// General Fitness Framework
export const GENERAL_FITNESS_FRAMEWORK: CoachingFramework = {
  goal: 'general fitness',
  assessmentCriteria: {
    weeklyVolume: { min: 150, optimal: 300, max: 500, unit: 'minutes' },
    frequency: { min: 3, optimal: 5, max: 7, unit: 'sessions/week' },
    keyWorkouts: [
      'Cardiovascular (3x/week)',
      'Strength training (2-3x/week)',
      'Flexibility/mobility (2x/week)'
    ],
    redFlags: [
      'Only cardio, no strength',
      'Only strength, no cardio',
      'No rest days',
      'Same workout every day'
    ],
    progressionRate: { safe: 10, aggressive: 20, unit: '% per week' }
  },
  responseTemplate: 'GENERAL_FITNESS_TEMPLATE'
};

// Strength/Muscle Building Framework
export const STRENGTH_FRAMEWORK: CoachingFramework = {
  goal: 'strength',
  assessmentCriteria: {
    weeklyVolume: { min: 8, optimal: 12, max: 20, unit: 'sets per muscle group' },
    frequency: { min: 2, optimal: 4, max: 6, unit: 'sessions/week' },
    keyWorkouts: [
      'Compound lifts (squat, deadlift, bench)',
      'Progressive overload tracking',
      'Adequate recovery (48h per muscle group)'
    ],
    redFlags: [
      'Training same muscles daily',
      'No progressive overload (same weight for weeks)',
      'Only isolation exercises',
      'Skipping legs'
    ],
    progressionRate: { safe: 2.5, aggressive: 5, unit: '% strength increase per month' }
  },
  responseTemplate: 'STRENGTH_TEMPLATE'
};

// Weight Loss Framework
export const WEIGHT_LOSS_FRAMEWORK: CoachingFramework = {
  goal: 'weight loss',
  assessmentCriteria: {
    weeklyVolume: { min: 250, optimal: 350, max: 500, unit: 'minutes cardio' },
    frequency: { min: 4, optimal: 5, max: 7, unit: 'sessions/week' },
    keyWorkouts: [
      'HIIT/metabolic training',
      'Strength to preserve muscle',
      'NEAT (daily activity)'
    ],
    redFlags: [
      'Excessive cardio (>500min/week)',
      'No strength training',
      'Inconsistent deficit',
      'Too aggressive deficit (>750 cal)'
    ],
    progressionRate: { safe: 0.5, aggressive: 1, unit: 'kg per week' }
  },
  responseTemplate: 'WEIGHT_LOSS_TEMPLATE'
};

/**
 * Question Intent Classification
 */
export type QuestionIntent =
  | 'progress_assessment'    // "How am I doing?" "Is my training going well?"
  | 'workout_planning'       // "What should I do today?" "Give me a workout"
  | 'nutrition_guidance'     // "What should I eat?" "Am I eating enough?"
  | 'problem_solving'        // "Why is X happening?" "How do I fix Y?"
  | 'motivation'             // "I'm feeling unmotivated" "Should I keep going?"
  | 'technique'              // "How do I do X?" "What's proper form?"
  | 'goal_setting';          // "What should my next goal be?" "Should I sign up?"

export function classifyQuestionIntent(question: string): QuestionIntent {
  const q = question.toLowerCase();

  // Progress assessment
  if (q.match(/how.*(am i|is my|going|doing|training|progress)/i) ||
      q.match(/am i (on track|doing (well|good|ok|okay)|improving)/i)) {
    return 'progress_assessment';
  }

  // Workout planning
  if (q.match(/(what|which) (should|could|can) i (do|workout|train)/i) ||
      q.match(/give me (a |an )?(workout|exercise|plan)/i) ||
      q.match(/(workout|exercise) (for|recommendation|suggestion)/i)) {
    return 'workout_planning';
  }

  // Nutrition
  if (q.match(/(what|how much) (should|could|can) i eat/i) ||
      q.match(/am i eating (enough|too much)/i) ||
      q.match(/(meal|food|nutrition|diet|protein|calories)/i)) {
    return 'nutrition_guidance';
  }

  // Problem solving
  if (q.match(/why (is|does|did|am i)/i) ||
      q.match(/how (do i|can i|to) (fix|improve|solve)/i) ||
      q.match(/(problem|issue|struggling|hurts|pain)/i)) {
    return 'problem_solving';
  }

  // Motivation
  if (q.match(/(unmotivated|tired|burned out|don't want|struggling|hard)/i) ||
      q.match(/should i (keep|continue|quit|take a break)/i)) {
    return 'motivation';
  }

  // Technique
  if (q.match(/how (do i|to) (do|perform|execute)/i) ||
      q.match(/(proper|correct|right|best) (form|technique|way)/i)) {
    return 'technique';
  }

  // Goal setting
  if (q.match(/should i (sign up|do|attempt|try)/i) ||
      q.match(/what.*(next|new) goal/i) ||
      q.match(/am i ready (for|to)/i)) {
    return 'goal_setting';
  }

  return 'progress_assessment'; // Default
}

/**
 * Get framework based on user goal
 */
export function getCoachingFramework(goal: string): CoachingFramework {
  const g = goal.toLowerCase();

  if (g.includes('marathon') || g.includes('running') || g.includes('run')) {
    return HALF_MARATHON_FRAMEWORK;
  }
  if (g.includes('strength') || g.includes('muscle') || g.includes('lift') || g.includes('strong')) {
    return STRENGTH_FRAMEWORK;
  }
  if (g.includes('weight loss') || g.includes('lose weight') || g.includes('fat loss')) {
    return WEIGHT_LOSS_FRAMEWORK;
  }

  return GENERAL_FITNESS_FRAMEWORK;
}

/**
 * Build intent-specific coaching instructions
 */
export function buildIntentInstructions(intent: QuestionIntent, framework: CoachingFramework): string {
  switch (intent) {
    case 'progress_assessment':
      return `USER IS ASKING FOR PROGRESS ASSESSMENT

YOUR JOB: Provide HONEST, DATA-DRIVEN evaluation

Required Structure:
1. CURRENT STATE: Specific metrics from their data (volume, frequency, types)
2. TARGET STATE: What they SHOULD be doing for their goal (${framework.goal})
3. GAP ANALYSIS: What's missing? What's wrong?
4. ASSESSMENT: GOOD / NEEDS WORK / OFF TRACK (be specific)
5. ACTION PLAN: Exact changes needed next week

Key Criteria for ${framework.goal}:
- Volume: ${framework.assessmentCriteria.weeklyVolume.optimal}${framework.assessmentCriteria.weeklyVolume.unit}
- Frequency: ${framework.assessmentCriteria.frequency.optimal}${framework.assessmentCriteria.frequency.unit}
- Key Workouts: ${framework.assessmentCriteria.keyWorkouts.join(', ')}

Red Flags to Check:
${framework.assessmentCriteria.redFlags.map(r => `- ${r}`).join('\n')}

BE BRUTALLY HONEST:
- If they're missing key workouts → SAY IT
- If volume is too low → TELL THEM
- If they're doing wrong things → POINT IT OUT
- Give SPECIFIC numbers and SPECIFIC fixes

Example:
❌ "You're doing well, keep it up"
✅ "You're only running 15km/week - need 35km minimum for half marathon. Missing long runs entirely. Add: 1×12km long run, 2×8km easy runs this week."`;

    case 'workout_planning':
      return `USER WANTS SPECIFIC WORKOUT RECOMMENDATION

YOUR JOB: Give them EXACTLY what to do

Required:
1. Check recent workouts (avoid overtraining same areas)
2. Consider their goal (${framework.goal})
3. Account for constraints (time, equipment, injuries)
4. Provide SPECIFIC workout with:
   - Exercise selection
   - Sets × reps or distance/time
   - Intensity/pace
   - Rest periods
   - Total duration

Example:
❌ "Do some cardio and strength work"
✅ "TODAY'S WORKOUT (45min):
   Warmup: 10min easy jog
   Main: 6×800m at 4:30/km pace, 2min rest between
   Cooldown: 5min walk

   Why: You haven't done speed work in 2 weeks, and you need interval training for half marathon"`;

    case 'nutrition_guidance':
      return `USER WANTS NUTRITION ADVICE

YOUR JOB: Analyze their intake and provide specific guidance

Required:
1. Check today's logged meals (calories, protein, carbs)
2. Calculate needs based on activity (${framework.assessmentCriteria.weeklyVolume.optimal}${framework.assessmentCriteria.weeklyVolume.unit})
3. Identify gaps (protein, calories, nutrients)
4. Give specific meal suggestions
5. ALWAYS check allergies/restrictions first

BE SPECIFIC:
- "Eat 150g protein" not "eat more protein"
- "Add chicken breast, Greek yogurt, protein shake" not "high protein foods"
- Show the math: "You ate 1800 cal, need 2400 = 600 cal deficit"`;

    case 'problem_solving':
      return `USER HAS A PROBLEM TO SOLVE

YOUR JOB: Diagnose and fix

Required:
1. Identify root cause from their data
2. Explain WHY it's happening
3. Give specific solution
4. Prevent future occurrence

Example:
❌ "Rest and see how it feels"
✅ "Your knee pain is likely from:
   - Running 6 days/week (overtraining)
   - All runs at same pace (no recovery)
   - No strength work (weak quads/glutes)

   Fix: Rest 3 days, then 3-4 runs/week with easy days, add squats/lunges 2x/week"`;

    case 'motivation':
      return `USER NEEDS MOTIVATION

YOUR JOB: Be honest but supportive, provide perspective

Required:
1. Acknowledge their feeling
2. Show their actual progress (data)
3. Reframe the situation
4. Give small, achievable next step

BE REAL:
- Don't bullshit them
- Show concrete progress
- Make the next step feel doable`;

    default:
      return 'Provide specific, actionable advice based on their data.';
  }
}