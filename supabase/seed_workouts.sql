-- Seed data for workouts and exercises
-- Run this after applying the migration to populate the database

-- First, ensure we have some exercises if they don't exist
INSERT INTO exercises (name, category, muscle_group, equipment, difficulty) VALUES
('Bench Press', 'chest', 'chest', 'barbell', 'intermediate'),
('Incline Dumbbell Press', 'chest', 'chest', 'dumbbell', 'intermediate'),
('Dumbbell Flyes', 'chest', 'chest', 'dumbbell', 'beginner'),
('Overhead Press', 'shoulders', 'shoulders', 'barbell', 'intermediate'),
('Lateral Raises', 'shoulders', 'shoulders', 'dumbbell', 'beginner'),
('Tricep Dips', 'arms', 'triceps', 'bodyweight', 'intermediate'),
('Pull-ups', 'back', 'lats', 'bodyweight', 'intermediate'),
('Barbell Rows', 'back', 'back', 'barbell', 'intermediate'),
('Lat Pulldowns', 'back', 'lats', 'cable', 'beginner'),
('Bicep Curls', 'arms', 'biceps', 'dumbbell', 'beginner'),
('Hammer Curls', 'arms', 'biceps', 'dumbbell', 'beginner'),
('Squats', 'legs', 'quads', 'barbell', 'intermediate'),
('Romanian Deadlifts', 'legs', 'hamstrings', 'barbell', 'intermediate'),
('Leg Press', 'legs', 'quads', 'machine', 'beginner'),
('Leg Curls', 'legs', 'hamstrings', 'machine', 'beginner'),
('Calf Raises', 'legs', 'calves', 'bodyweight', 'beginner'),
('Planks', 'core', 'abs', 'bodyweight', 'beginner'),
('Russian Twists', 'core', 'abs', 'bodyweight', 'beginner')
ON CONFLICT (name) DO NOTHING;

-- Create some sample workouts if they don't exist
INSERT INTO workouts (name, type, goal, difficulty, estimated_duration_minutes, description) VALUES
('Push Day A', 'push', 'build_muscle', 'intermediate', 45, 'Chest, shoulders, and triceps focused workout for upper body strength'),
('Pull Day A', 'pull', 'build_muscle', 'intermediate', 45, 'Back and biceps workout for a stronger posterior chain'),
('Leg Day A', 'legs', 'build_muscle', 'intermediate', 60, 'Complete lower body workout targeting quads, hamstrings, and glutes'),
('Upper Power', 'upper', 'gain_strength', 'advanced', 60, 'Heavy upper body session for strength gains'),
('Lower Power', 'lower', 'gain_strength', 'advanced', 60, 'Heavy lower body session for strength gains'),
('Full Body Starter', 'full_body', 'all', 'beginner', 30, 'Perfect introduction to weight training'),
('Core Blast', 'core', 'all', 'beginner', 20, 'Quick core strengthening routine'),
('Push Day B', 'push', 'build_muscle', 'intermediate', 45, 'Variation push workout with different exercises'),
('Pull Day B', 'pull', 'build_muscle', 'intermediate', 45, 'Variation pull workout for muscle confusion'),
('Leg Day B', 'legs', 'build_muscle', 'intermediate', 60, 'Alternative leg workout with machine focus')
ON CONFLICT DO NOTHING;

-- Link exercises to workouts (workout_exercises)
-- Get workout IDs and create exercise links

-- Push Day A
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
SELECT
  w.id,
  e.id,
  CASE
    WHEN e.name = 'Bench Press' THEN 4
    WHEN e.name = 'Incline Dumbbell Press' THEN 3
    WHEN e.name = 'Dumbbell Flyes' THEN 3
    WHEN e.name = 'Overhead Press' THEN 3
    WHEN e.name = 'Lateral Raises' THEN 3
    WHEN e.name = 'Tricep Dips' THEN 3
  END as sets,
  CASE
    WHEN e.name = 'Bench Press' THEN '8'
    WHEN e.name = 'Incline Dumbbell Press' THEN '10'
    WHEN e.name = 'Dumbbell Flyes' THEN '12'
    WHEN e.name = 'Overhead Press' THEN '8'
    WHEN e.name = 'Lateral Raises' THEN '15'
    WHEN e.name = 'Tricep Dips' THEN '12'
  END as reps,
  CASE
    WHEN e.name IN ('Bench Press', 'Overhead Press') THEN 120
    ELSE 90
  END as rest_seconds,
  CASE
    WHEN e.name = 'Bench Press' THEN 1
    WHEN e.name = 'Incline Dumbbell Press' THEN 2
    WHEN e.name = 'Dumbbell Flyes' THEN 3
    WHEN e.name = 'Overhead Press' THEN 4
    WHEN e.name = 'Lateral Raises' THEN 5
    WHEN e.name = 'Tricep Dips' THEN 6
  END as order_index
FROM workouts w
CROSS JOIN exercises e
WHERE w.name = 'Push Day A'
  AND e.name IN ('Bench Press', 'Incline Dumbbell Press', 'Dumbbell Flyes', 'Overhead Press', 'Lateral Raises', 'Tricep Dips')
ON CONFLICT DO NOTHING;

-- Pull Day A
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
SELECT
  w.id,
  e.id,
  CASE
    WHEN e.name = 'Pull-ups' THEN 4
    WHEN e.name = 'Barbell Rows' THEN 4
    WHEN e.name = 'Lat Pulldowns' THEN 3
    WHEN e.name = 'Bicep Curls' THEN 3
    WHEN e.name = 'Hammer Curls' THEN 3
  END as sets,
  CASE
    WHEN e.name = 'Pull-ups' THEN '8'
    WHEN e.name = 'Barbell Rows' THEN '10'
    WHEN e.name = 'Lat Pulldowns' THEN '12'
    WHEN e.name = 'Bicep Curls' THEN '12'
    WHEN e.name = 'Hammer Curls' THEN '12'
  END as reps,
  90 as rest_seconds,
  CASE
    WHEN e.name = 'Pull-ups' THEN 1
    WHEN e.name = 'Barbell Rows' THEN 2
    WHEN e.name = 'Lat Pulldowns' THEN 3
    WHEN e.name = 'Bicep Curls' THEN 4
    WHEN e.name = 'Hammer Curls' THEN 5
  END as order_index
FROM workouts w
CROSS JOIN exercises e
WHERE w.name = 'Pull Day A'
  AND e.name IN ('Pull-ups', 'Barbell Rows', 'Lat Pulldowns', 'Bicep Curls', 'Hammer Curls')
ON CONFLICT DO NOTHING;

-- Leg Day A
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
SELECT
  w.id,
  e.id,
  CASE
    WHEN e.name = 'Squats' THEN 4
    WHEN e.name = 'Romanian Deadlifts' THEN 4
    WHEN e.name = 'Leg Press' THEN 3
    WHEN e.name = 'Leg Curls' THEN 3
    WHEN e.name = 'Calf Raises' THEN 4
  END as sets,
  CASE
    WHEN e.name = 'Squats' THEN '8'
    WHEN e.name = 'Romanian Deadlifts' THEN '10'
    WHEN e.name = 'Leg Press' THEN '12'
    WHEN e.name = 'Leg Curls' THEN '15'
    WHEN e.name = 'Calf Raises' THEN '20'
  END as reps,
  CASE
    WHEN e.name IN ('Squats', 'Romanian Deadlifts') THEN 150
    ELSE 90
  END as rest_seconds,
  CASE
    WHEN e.name = 'Squats' THEN 1
    WHEN e.name = 'Romanian Deadlifts' THEN 2
    WHEN e.name = 'Leg Press' THEN 3
    WHEN e.name = 'Leg Curls' THEN 4
    WHEN e.name = 'Calf Raises' THEN 5
  END as order_index
FROM workouts w
CROSS JOIN exercises e
WHERE w.name = 'Leg Day A'
  AND e.name IN ('Squats', 'Romanian Deadlifts', 'Leg Press', 'Leg Curls', 'Calf Raises')
ON CONFLICT DO NOTHING;

-- Full Body Starter
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
SELECT
  w.id,
  e.id,
  3 as sets,
  '10' as reps,
  60 as rest_seconds,
  CASE
    WHEN e.name = 'Squats' THEN 1
    WHEN e.name = 'Bench Press' THEN 2
    WHEN e.name = 'Barbell Rows' THEN 3
    WHEN e.name = 'Overhead Press' THEN 4
    WHEN e.name = 'Planks' THEN 5
  END as order_index
FROM workouts w
CROSS JOIN exercises e
WHERE w.name = 'Full Body Starter'
  AND e.name IN ('Squats', 'Bench Press', 'Barbell Rows', 'Overhead Press', 'Planks')
ON CONFLICT DO NOTHING;

-- Core Blast
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index)
SELECT
  w.id,
  e.id,
  3 as sets,
  CASE
    WHEN e.name = 'Planks' THEN '60'  -- 60 seconds
    WHEN e.name = 'Russian Twists' THEN '20'
  END as reps,
  45 as rest_seconds,
  CASE
    WHEN e.name = 'Planks' THEN 1
    WHEN e.name = 'Russian Twists' THEN 2
  END as order_index
FROM workouts w
CROSS JOIN exercises e
WHERE w.name = 'Core Blast'
  AND e.name IN ('Planks', 'Russian Twists')
ON CONFLICT DO NOTHING;