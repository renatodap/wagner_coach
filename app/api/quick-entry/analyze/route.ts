import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

type EntryType = 'meal' | 'activity' | 'workout' | 'unknown';

interface ParsedEntry {
  type: EntryType;
  data: any;
  confidence: number;
  suggestions?: string[];
}

// Patterns to identify entry types
const MEAL_KEYWORDS = ['ate', 'meal', 'breakfast', 'lunch', 'dinner', 'snack', 'calories', 'protein', 'carbs', 'food', 'drink', 'consumed'];
const ACTIVITY_KEYWORDS = ['ran', 'walked', 'cycled', 'swam', 'hiked', 'miles', 'km', 'minutes', 'hours', 'cardio', 'steps'];
const WORKOUT_KEYWORDS = ['workout', 'exercise', 'sets', 'reps', 'bench press', 'squat', 'deadlift', 'push-ups', 'pull-ups', 'chest', 'back', 'legs', 'arms', 'shoulders', 'gym'];

function determineEntryType(text: string): { type: EntryType; confidence: number } {
  const lowerText = text.toLowerCase();

  const mealScore = MEAL_KEYWORDS.filter(keyword => lowerText.includes(keyword)).length;
  const activityScore = ACTIVITY_KEYWORDS.filter(keyword => lowerText.includes(keyword)).length;
  const workoutScore = WORKOUT_KEYWORDS.filter(keyword => lowerText.includes(keyword)).length;

  const maxScore = Math.max(mealScore, activityScore, workoutScore);

  if (maxScore === 0) {
    return { type: 'unknown', confidence: 0 };
  }

  const totalScore = mealScore + activityScore + workoutScore;

  if (mealScore === maxScore) {
    return { type: 'meal', confidence: mealScore / totalScore };
  } else if (activityScore === maxScore) {
    return { type: 'activity', confidence: activityScore / totalScore };
  } else {
    return { type: 'workout', confidence: workoutScore / totalScore };
  }
}

function parseMealData(text: string) {
  // Extract nutritional information
  const calorieMatch = text.match(/(\d+)\s*(?:cal|calories|kcal)/i);
  const proteinMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)?\s*(?:of\s+)?protein/i);
  const carbsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)?\s*(?:of\s+)?carb(?:s|ohydrates)?/i);
  const fatMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)?\s*(?:of\s+)?fat/i);
  const fiberMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?)?\s*(?:of\s+)?fiber/i);

  // Try to extract meal name
  let mealName = text;
  // Remove nutritional info from the name
  mealName = mealName.replace(/\d+\s*(?:cal|calories|kcal|g|grams?|protein|carb|fat|fiber)/gi, '').trim();

  // Determine meal type based on keywords or time
  let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack';
  if (text.toLowerCase().includes('breakfast')) mealType = 'breakfast';
  else if (text.toLowerCase().includes('lunch')) mealType = 'lunch';
  else if (text.toLowerCase().includes('dinner')) mealType = 'dinner';
  else if (text.toLowerCase().includes('snack')) mealType = 'snack';
  else {
    // Use current time to guess meal type
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) mealType = 'breakfast';
    else if (hour >= 11 && hour < 15) mealType = 'lunch';
    else if (hour >= 17 && hour < 21) mealType = 'dinner';
    else mealType = 'snack';
  }

  return {
    name: mealName || 'Quick meal entry',
    meal_type: mealType,
    calories: calorieMatch ? parseInt(calorieMatch[1]) : null,
    protein_g: proteinMatch ? parseFloat(proteinMatch[1]) : null,
    carbs_g: carbsMatch ? parseFloat(carbsMatch[1]) : null,
    fat_g: fatMatch ? parseFloat(fatMatch[1]) : null,
    fiber_g: fiberMatch ? parseFloat(fiberMatch[1]) : null,
  };
}

function parseActivityData(text: string) {
  // Extract activity details
  const distanceMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:miles?|km|kilometers?)/i);
  const durationMatch = text.match(/(\d+)\s*(?:minutes?|mins?|hours?|hrs?)/i);
  const caloriesMatch = text.match(/(\d+)\s*(?:cal|calories|kcal)/i);

  // Try to identify activity type
  let activityName = 'Activity';
  let activityType = 'cardio';

  if (text.toLowerCase().includes('ran') || text.toLowerCase().includes('run')) {
    activityName = 'Running';
    activityType = 'running';
  } else if (text.toLowerCase().includes('walk')) {
    activityName = 'Walking';
    activityType = 'walking';
  } else if (text.toLowerCase().includes('cycl') || text.toLowerCase().includes('bike')) {
    activityName = 'Cycling';
    activityType = 'cycling';
  } else if (text.toLowerCase().includes('swim')) {
    activityName = 'Swimming';
    activityType = 'swimming';
  }

  // Add distance to name if found
  if (distanceMatch) {
    activityName += ` - ${distanceMatch[0]}`;
  }

  return {
    name: activityName,
    type: activityType,
    duration: durationMatch ? parseInt(durationMatch[1]) : null,
    distance: distanceMatch ? parseFloat(distanceMatch[1]) : null,
    calories: caloriesMatch ? parseInt(caloriesMatch[1]) : null,
    notes: text,
  };
}

function parseWorkoutData(text: string) {
  // Extract exercises from text
  const exercises = [];

  // Common exercise patterns
  const exercisePatterns = [
    /(\d+)\s*(?:sets?|x)\s*(?:of\s+)?(\d+)\s*(?:reps?)?/gi,
    /(\w+(?:\s+\w+)*?):\s*(\d+)\s*(?:sets?|x)\s*(\d+)/gi,
  ];

  // Try to identify workout name
  let workoutName = 'Workout';
  if (text.toLowerCase().includes('chest')) workoutName = 'Chest Day';
  else if (text.toLowerCase().includes('back')) workoutName = 'Back Day';
  else if (text.toLowerCase().includes('legs')) workoutName = 'Leg Day';
  else if (text.toLowerCase().includes('push')) workoutName = 'Push Day';
  else if (text.toLowerCase().includes('pull')) workoutName = 'Pull Day';
  else if (text.toLowerCase().includes('upper')) workoutName = 'Upper Body';
  else if (text.toLowerCase().includes('lower')) workoutName = 'Lower Body';

  // Extract individual exercises
  const exerciseNames = [
    'bench press', 'squat', 'deadlift', 'overhead press', 'row', 'pull-up',
    'push-up', 'dip', 'curl', 'tricep', 'lat pulldown', 'leg press',
    'lunges', 'calf raises', 'plank', 'crunch'
  ];

  for (const exerciseName of exerciseNames) {
    if (text.toLowerCase().includes(exerciseName)) {
      exercises.push({
        name: exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1),
        sets: 3,
        reps: 10,
        weight: null,
      });
    }
  }

  return {
    name: workoutName,
    description: text,
    exercises: exercises.length > 0 ? exercises : [
      { name: 'Exercise 1', sets: 3, reps: 10, weight: null }
    ],
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Text input is required' },
        { status: 400 }
      );
    }

    // Determine entry type
    const { type, confidence } = determineEntryType(text);

    // Parse data based on type
    let parsedData;
    const suggestions: string[] = [];

    switch (type) {
      case 'meal':
        parsedData = parseMealData(text);
        if (!parsedData.calories) {
          suggestions.push('Consider adding calorie information');
        }
        if (!parsedData.protein_g && !parsedData.carbs_g && !parsedData.fat_g) {
          suggestions.push('Try including macronutrient details (protein, carbs, fat)');
        }
        break;

      case 'activity':
        parsedData = parseActivityData(text);
        if (!parsedData.duration) {
          suggestions.push('Include duration for better tracking');
        }
        if (!parsedData.calories) {
          suggestions.push('Add calories burned if known');
        }
        break;

      case 'workout':
        parsedData = parseWorkoutData(text);
        if (parsedData.exercises.length === 1 && parsedData.exercises[0].name === 'Exercise 1') {
          suggestions.push('Specify exercise names for better tracking');
        }
        suggestions.push('Consider adding sets, reps, and weights');
        break;

      default:
        return NextResponse.json({
          type: 'unknown',
          data: null,
          confidence: 0,
          suggestions: [
            'Try being more specific',
            'Include keywords like "ate", "ran", "workout"',
            'Add nutritional info or exercise details'
          ]
        });
    }

    // Return parsed entry
    const response: ParsedEntry = {
      type,
      data: parsedData,
      confidence,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Quick entry analysis error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to analyze entry' },
      { status: 500 }
    );
  }
}