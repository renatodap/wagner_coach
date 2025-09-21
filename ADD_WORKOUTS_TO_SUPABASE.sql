-- Complete Migration: Add Workouts and Exercises to Your Database
-- Run this entire file in Supabase SQL Editor

-- Step 1: Insert Exercises
INSERT INTO exercises (name, category, muscle_group, equipment, difficulty, instructions) VALUES
('Bench Press', 'chest', 'chest', 'barbell', 'intermediate', ARRAY['Lie on bench', 'Grip bar slightly wider than shoulders', 'Lower to chest', 'Press up explosively']),
('Incline Dumbbell Press', 'chest', 'chest', 'dumbbell', 'intermediate', ARRAY['Set bench to 30-45 degrees', 'Hold dumbbells at chest', 'Press up and together', 'Lower with control']),
('Dumbbell Flyes', 'chest', 'chest', 'dumbbell', 'beginner', ARRAY['Lie on bench', 'Arms slightly bent', 'Lower in arc motion', 'Squeeze at top']),
('Overhead Press', 'shoulders', 'shoulders', 'barbell', 'intermediate', ARRAY['Stand with feet shoulder-width', 'Bar at collar bone', 'Press overhead', 'Lower with control']),
('Lateral Raises', 'shoulders', 'shoulders', 'dumbbell', 'beginner', ARRAY['Stand with dumbbells at sides', 'Raise to shoulder height', 'Pause at top', 'Lower slowly']),
('Tricep Dips', 'arms', 'triceps', 'bodyweight', 'intermediate', ARRAY['Grip parallel bars', 'Lower body', 'Push back up', 'Keep elbows close']),
('Cable Tricep Pushdown', 'arms', 'triceps', 'cable', 'beginner', ARRAY['Stand at cable machine', 'Keep elbows locked', 'Push down fully', 'Control the return']),
('Pull-ups', 'back', 'lats', 'bodyweight', 'intermediate', ARRAY['Hang from bar', 'Pull up to chin', 'Lower with control', 'Full range of motion']),
('Barbell Rows', 'back', 'back', 'barbell', 'intermediate', ARRAY['Hinge at hips', 'Pull bar to stomach', 'Squeeze shoulder blades', 'Lower with control']),
('Lat Pulldowns', 'back', 'lats', 'cable', 'beginner', ARRAY['Sit at machine', 'Pull bar to chest', 'Squeeze lats', 'Control the return']),
('Deadlifts', 'back', 'back', 'barbell', 'advanced', ARRAY['Stand with feet hip-width', 'Grip bar outside legs', 'Lift with legs and back', 'Stand tall at top']),
('Bicep Curls', 'arms', 'biceps', 'dumbbell', 'beginner', ARRAY['Stand with dumbbells', 'Curl to shoulders', 'Squeeze at top', 'Lower slowly']),
('Hammer Curls', 'arms', 'biceps', 'dumbbell', 'beginner', ARRAY['Hold dumbbells neutral', 'Curl without rotating', 'Keep elbows stable', 'Control tempo']),
('Preacher Curls', 'arms', 'biceps', 'barbell', 'intermediate', ARRAY['Sit at preacher bench', 'Curl bar up', 'Squeeze biceps', 'Lower with control']),
('Squats', 'legs', 'quads', 'barbell', 'intermediate', ARRAY['Bar on upper back', 'Squat to parallel', 'Drive through heels', 'Keep chest up']),
('Front Squats', 'legs', 'quads', 'barbell', 'advanced', ARRAY['Bar on front delts', 'Keep elbows high', 'Squat deep', 'Drive up strong']),
('Romanian Deadlifts', 'legs', 'hamstrings', 'barbell', 'intermediate', ARRAY['Hold bar at hips', 'Push hips back', 'Feel hamstring stretch', 'Drive hips forward']),
('Leg Press', 'legs', 'quads', 'machine', 'beginner', ARRAY['Sit in machine', 'Feet shoulder-width', 'Press through heels', 'Control descent']),
('Leg Curls', 'legs', 'hamstrings', 'machine', 'beginner', ARRAY['Lie face down', 'Curl heels to glutes', 'Squeeze hamstrings', 'Lower slowly']),
('Leg Extensions', 'legs', 'quads', 'machine', 'beginner', ARRAY['Sit in machine', 'Extend legs fully', 'Squeeze quads', 'Lower with control']),
('Walking Lunges', 'legs', 'quads', 'dumbbell', 'intermediate', ARRAY['Hold dumbbells', 'Step forward', 'Lower back knee', 'Push off front foot']),
('Calf Raises', 'legs', 'calves', 'bodyweight', 'beginner', ARRAY['Stand on balls of feet', 'Rise up high', 'Squeeze calves', 'Lower slowly']),
('Planks', 'core', 'abs', 'bodyweight', 'beginner', ARRAY['Forearm position', 'Keep body straight', 'Engage core', 'Hold position']),
('Russian Twists', 'core', 'abs', 'bodyweight', 'beginner', ARRAY['Sit with knees bent', 'Lean back slightly', 'Rotate side to side', 'Keep core engaged']),
('Hanging Knee Raises', 'core', 'abs', 'bodyweight', 'intermediate', ARRAY['Hang from bar', 'Raise knees to chest', 'Lower with control', 'Avoid swinging']),
('Cable Crunches', 'core', 'abs', 'cable', 'intermediate', ARRAY['Kneel at cable', 'Crunch forward', 'Squeeze abs', 'Return slowly'])
ON CONFLICT (name) DO NOTHING;

-- Step 2: Insert Workouts
INSERT INTO workouts (name, type, goal, difficulty, estimated_duration_minutes, description) VALUES
('WAGNER PUSH DAY', 'push', 'build_muscle', 'intermediate', 45, 'Brutal chest, shoulders, and triceps workout. No mercy.'),
('WAGNER PULL DAY', 'pull', 'build_muscle', 'intermediate', 45, 'Back and biceps destruction. Build that V-taper.'),
('WAGNER LEG DAY', 'legs', 'build_muscle', 'advanced', 60, 'Leg day that separates warriors from wannabes.'),
('UPPER POWER', 'upper', 'gain_strength', 'advanced', 60, 'Heavy upper body work. Move serious weight.'),
('LOWER POWER', 'lower', 'gain_strength', 'advanced', 60, 'Squat and deadlift focused. Build real strength.'),
('FULL BODY DESTRUCTION', 'full_body', 'all', 'intermediate', 45, 'Total body annihilation in under an hour.'),
('CORE CRUSHER', 'core', 'all', 'intermediate', 20, 'Abs and core work that burns like hell.'),
('CHEST & TRICEPS', 'chest', 'build_muscle', 'intermediate', 40, 'Focused chest and tricep pump workout.'),
('BACK & BICEPS', 'back', 'build_muscle', 'intermediate', 40, 'Build a massive back and peak biceps.'),
('SHOULDERS & ABS', 'shoulders', 'build_muscle', 'intermediate', 35, 'Boulder shoulders and shredded abs.'),
('ARM BLASTER', 'arms', 'build_muscle', 'beginner', 30, 'Direct arm work for bigger guns.'),
('BEGINNER BASICS', 'full_body', 'all', 'beginner', 30, 'Perfect starting point for new warriors.'),
('CARDIO HIIT', 'cardio', 'lose_weight', 'intermediate', 25, 'High intensity intervals to burn fat.'),
('PUSH POWER', 'push', 'gain_strength', 'advanced', 50, 'Heavy pressing movements for raw power.'),
('PULL POWER', 'pull', 'gain_strength', 'advanced', 50, 'Heavy pulling for back thickness.')
ON CONFLICT DO NOTHING;

-- Step 3: Get workout IDs (we'll use a CTE for cleaner code)
WITH workout_ids AS (
  SELECT id, name FROM workouts
),
exercise_ids AS (
  SELECT id, name FROM exercises
)

-- Step 4: Link exercises to WAGNER PUSH DAY
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index, notes)
SELECT
  w.id, e.id,
  CASE e.name
    WHEN 'Bench Press' THEN 4
    WHEN 'Incline Dumbbell Press' THEN 3
    WHEN 'Dumbbell Flyes' THEN 3
    WHEN 'Overhead Press' THEN 4
    WHEN 'Lateral Raises' THEN 4
    WHEN 'Tricep Dips' THEN 3
    WHEN 'Cable Tricep Pushdown' THEN 3
  END,
  CASE e.name
    WHEN 'Bench Press' THEN '6-8'
    WHEN 'Incline Dumbbell Press' THEN '8-10'
    WHEN 'Dumbbell Flyes' THEN '12-15'
    WHEN 'Overhead Press' THEN '6-8'
    WHEN 'Lateral Raises' THEN '12-15'
    WHEN 'Tricep Dips' THEN '8-12'
    WHEN 'Cable Tricep Pushdown' THEN '12-15'
  END,
  CASE e.name
    WHEN 'Bench Press' THEN 120
    WHEN 'Overhead Press' THEN 120
    ELSE 90
  END,
  CASE e.name
    WHEN 'Bench Press' THEN 1
    WHEN 'Incline Dumbbell Press' THEN 2
    WHEN 'Dumbbell Flyes' THEN 3
    WHEN 'Overhead Press' THEN 4
    WHEN 'Lateral Raises' THEN 5
    WHEN 'Tricep Dips' THEN 6
    WHEN 'Cable Tricep Pushdown' THEN 7
  END,
  CASE e.name
    WHEN 'Bench Press' THEN 'Go heavy or go home'
    WHEN 'Overhead Press' THEN 'Strict form, no leg drive'
    ELSE NULL
  END
FROM workout_ids w, exercise_ids e
WHERE w.name = 'WAGNER PUSH DAY'
AND e.name IN ('Bench Press', 'Incline Dumbbell Press', 'Dumbbell Flyes', 'Overhead Press', 'Lateral Raises', 'Tricep Dips', 'Cable Tricep Pushdown')
ON CONFLICT DO NOTHING;

-- Link exercises to WAGNER PULL DAY
WITH workout_ids AS (
  SELECT id, name FROM workouts
),
exercise_ids AS (
  SELECT id, name FROM exercises
)
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index, notes)
SELECT
  w.id, e.id,
  CASE e.name
    WHEN 'Deadlifts' THEN 4
    WHEN 'Pull-ups' THEN 4
    WHEN 'Barbell Rows' THEN 4
    WHEN 'Lat Pulldowns' THEN 3
    WHEN 'Bicep Curls' THEN 4
    WHEN 'Hammer Curls' THEN 3
  END,
  CASE e.name
    WHEN 'Deadlifts' THEN '5-6'
    WHEN 'Pull-ups' THEN '6-10'
    WHEN 'Barbell Rows' THEN '8-10'
    WHEN 'Lat Pulldowns' THEN '10-12'
    WHEN 'Bicep Curls' THEN '10-12'
    WHEN 'Hammer Curls' THEN '12-15'
  END,
  CASE e.name
    WHEN 'Deadlifts' THEN 180
    WHEN 'Pull-ups' THEN 120
    ELSE 90
  END,
  CASE e.name
    WHEN 'Deadlifts' THEN 1
    WHEN 'Pull-ups' THEN 2
    WHEN 'Barbell Rows' THEN 3
    WHEN 'Lat Pulldowns' THEN 4
    WHEN 'Bicep Curls' THEN 5
    WHEN 'Hammer Curls' THEN 6
  END,
  CASE e.name
    WHEN 'Deadlifts' THEN 'Reset each rep, no bouncing'
    WHEN 'Pull-ups' THEN 'Add weight if too easy'
    ELSE NULL
  END
FROM workout_ids w, exercise_ids e
WHERE w.name = 'WAGNER PULL DAY'
AND e.name IN ('Deadlifts', 'Pull-ups', 'Barbell Rows', 'Lat Pulldowns', 'Bicep Curls', 'Hammer Curls')
ON CONFLICT DO NOTHING;

-- Link exercises to WAGNER LEG DAY
WITH workout_ids AS (
  SELECT id, name FROM workouts
),
exercise_ids AS (
  SELECT id, name FROM exercises
)
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index, notes)
SELECT
  w.id, e.id,
  CASE e.name
    WHEN 'Squats' THEN 5
    WHEN 'Romanian Deadlifts' THEN 4
    WHEN 'Leg Press' THEN 4
    WHEN 'Leg Curls' THEN 4
    WHEN 'Walking Lunges' THEN 3
    WHEN 'Calf Raises' THEN 4
  END,
  CASE e.name
    WHEN 'Squats' THEN '5-8'
    WHEN 'Romanian Deadlifts' THEN '8-10'
    WHEN 'Leg Press' THEN '12-15'
    WHEN 'Leg Curls' THEN '12-15'
    WHEN 'Walking Lunges' THEN '10 each'
    WHEN 'Calf Raises' THEN '15-20'
  END,
  CASE e.name
    WHEN 'Squats' THEN 180
    WHEN 'Romanian Deadlifts' THEN 120
    ELSE 90
  END,
  CASE e.name
    WHEN 'Squats' THEN 1
    WHEN 'Romanian Deadlifts' THEN 2
    WHEN 'Leg Press' THEN 3
    WHEN 'Leg Curls' THEN 4
    WHEN 'Walking Lunges' THEN 5
    WHEN 'Calf Raises' THEN 6
  END,
  CASE e.name
    WHEN 'Squats' THEN 'Ass to grass'
    WHEN 'Walking Lunges' THEN 'Long strides, feel the burn'
    ELSE NULL
  END
FROM workout_ids w, exercise_ids e
WHERE w.name = 'WAGNER LEG DAY'
AND e.name IN ('Squats', 'Romanian Deadlifts', 'Leg Press', 'Leg Curls', 'Walking Lunges', 'Calf Raises')
ON CONFLICT DO NOTHING;

-- Verify everything worked
SELECT 'Workouts Added:' as status, COUNT(*) as count FROM workouts
UNION ALL
SELECT 'Exercises Added:', COUNT(*) FROM exercises
UNION ALL
SELECT 'Workout-Exercise Links:', COUNT(*) FROM workout_exercises;