-- IRON DISCIPLINE MVP Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  goal TEXT CHECK (goal IN ('build_muscle', 'lose_weight', 'gain_strength')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercises library (comprehensive list)
CREATE TABLE exercises (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN ('chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio')),
  muscle_group TEXT NOT NULL,
  equipment TEXT CHECK (equipment IN ('barbell', 'dumbbell', 'bodyweight', 'cable', 'machine', 'kettlebell', 'band', 'none')),
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  instructions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workouts table (pre-defined workout templates)
CREATE TABLE workouts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('push', 'pull', 'legs', 'upper', 'lower', 'full_body', 'arms', 'shoulders', 'chest', 'back', 'core', 'cardio')),
  goal TEXT CHECK (goal IN ('build_muscle', 'lose_weight', 'gain_strength', 'all')),
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workout exercises (many-to-many relationship)
CREATE TABLE workout_exercises (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id INTEGER REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps TEXT NOT NULL, -- Can be range like "8-12" or fixed like "10"
  rest_seconds INTEGER,
  order_index INTEGER NOT NULL,
  notes TEXT,
  UNIQUE(workout_id, exercise_id, order_index)
);

-- User's scheduled workouts
CREATE TABLE user_workouts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  workout_id INTEGER REFERENCES workouts(id),
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, scheduled_date)
);

-- Workout completions (tracking actual performance)
CREATE TABLE workout_completions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_workout_id INTEGER REFERENCES user_workouts(id) ON DELETE CASCADE,
  workout_id INTEGER REFERENCES workouts(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

-- Exercise performance tracking (what user actually did)
CREATE TABLE exercise_completions (
  id SERIAL PRIMARY KEY,
  completion_id INTEGER REFERENCES workout_completions(id) ON DELETE CASCADE,
  exercise_id INTEGER REFERENCES exercises(id),
  sets_completed INTEGER,
  reps_completed INTEGER[],
  weight_kg DECIMAL[],
  notes TEXT
);

-- User settings
CREATE TABLE user_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  preferred_workout_days TEXT[] DEFAULT ARRAY['monday', 'wednesday', 'friday'],
  preferred_workout_time TIME,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User workouts policies
CREATE POLICY "Users can view their own workouts" ON user_workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workouts" ON user_workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts" ON user_workouts
  FOR UPDATE USING (auth.uid() = user_id);

-- Workout completions policies
CREATE POLICY "Users can view their own completions" ON workout_completions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own completions" ON workout_completions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exercise completions policies
CREATE POLICY "Users can view their own exercise completions" ON exercise_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_completions wc
      WHERE wc.id = exercise_completions.completion_id
      AND wc.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own exercise completions" ON exercise_completions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_completions wc
      WHERE wc.id = exercise_completions.completion_id
      AND wc.user_id = auth.uid()
    )
  );

-- User settings policies
CREATE POLICY "Users can view their own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample exercises
INSERT INTO exercises (name, category, muscle_group, equipment, difficulty, instructions) VALUES
-- Chest exercises
('Barbell Bench Press', 'chest', 'chest', 'barbell', 'intermediate', ARRAY['Lie on bench with eyes under bar', 'Grip bar slightly wider than shoulders', 'Lower bar to chest with control', 'Press up powerfully']),
('Dumbbell Bench Press', 'chest', 'chest', 'dumbbell', 'beginner', ARRAY['Lie on bench with dumbbells at chest', 'Press dumbbells up and together', 'Lower with control']),
('Incline Barbell Press', 'chest', 'upper chest', 'barbell', 'intermediate', ARRAY['Set bench to 30-45 degrees', 'Lower bar to upper chest', 'Press up and slightly back']),
('Dumbbell Flyes', 'chest', 'chest', 'dumbbell', 'intermediate', ARRAY['Lie on bench with dumbbells up', 'Lower in arc with slight elbow bend', 'Squeeze chest to bring back up']),
('Push-ups', 'chest', 'chest', 'bodyweight', 'beginner', ARRAY['Start in plank position', 'Lower chest to floor', 'Push back up']),
('Dips', 'chest', 'lower chest', 'bodyweight', 'intermediate', ARRAY['Grip parallel bars', 'Lower until shoulders below elbows', 'Push back up']),

-- Back exercises
('Deadlift', 'back', 'full back', 'barbell', 'advanced', ARRAY['Stand with feet hip-width apart', 'Grip bar outside legs', 'Lift by extending hips and knees', 'Stand tall with shoulders back']),
('Barbell Row', 'back', 'lats', 'barbell', 'intermediate', ARRAY['Hinge forward at hips', 'Row bar to lower chest', 'Squeeze shoulder blades together']),
('Pull-ups', 'back', 'lats', 'bodyweight', 'intermediate', ARRAY['Hang from bar with overhand grip', 'Pull until chin over bar', 'Lower with control']),
('Lat Pulldown', 'back', 'lats', 'cable', 'beginner', ARRAY['Sit at lat pulldown machine', 'Pull bar to upper chest', 'Control the weight up']),
('Dumbbell Row', 'back', 'lats', 'dumbbell', 'beginner', ARRAY['Support with one hand on bench', 'Row dumbbell to hip', 'Lower with control']),
('T-Bar Row', 'back', 'middle back', 'barbell', 'intermediate', ARRAY['Straddle T-bar', 'Row to chest', 'Squeeze at top']),

-- Legs exercises
('Back Squat', 'legs', 'quads', 'barbell', 'intermediate', ARRAY['Bar on upper traps', 'Squat down until thighs parallel', 'Drive through heels to stand']),
('Front Squat', 'legs', 'quads', 'barbell', 'advanced', ARRAY['Bar on front delts', 'Keep elbows high', 'Squat with upright torso']),
('Goblet Squat', 'legs', 'quads', 'dumbbell', 'beginner', ARRAY['Hold dumbbell at chest', 'Squat between legs', 'Drive up through heels']),
('Romanian Deadlift', 'legs', 'hamstrings', 'barbell', 'intermediate', ARRAY['Bar at hips', 'Push hips back', 'Feel stretch in hamstrings', 'Drive hips forward']),
('Leg Press', 'legs', 'quads', 'machine', 'beginner', ARRAY['Sit in leg press machine', 'Lower until 90 degrees', 'Press through heels']),
('Walking Lunges', 'legs', 'quads', 'dumbbell', 'beginner', ARRAY['Step forward into lunge', 'Lower back knee toward floor', 'Push off front foot to next step']),
('Leg Curls', 'legs', 'hamstrings', 'machine', 'beginner', ARRAY['Lie face down on machine', 'Curl heels toward glutes', 'Lower with control']),
('Calf Raises', 'legs', 'calves', 'bodyweight', 'beginner', ARRAY['Stand on balls of feet', 'Rise up on toes', 'Lower with control']),

-- Shoulder exercises
('Overhead Press', 'shoulders', 'shoulders', 'barbell', 'intermediate', ARRAY['Bar at collar bone', 'Press straight up', 'Lock out overhead']),
('Dumbbell Shoulder Press', 'shoulders', 'shoulders', 'dumbbell', 'beginner', ARRAY['Dumbbells at shoulder height', 'Press up and together', 'Lower with control']),
('Lateral Raises', 'shoulders', 'side delts', 'dumbbell', 'beginner', ARRAY['Arms at sides', 'Raise to shoulder height', 'Control the descent']),
('Face Pulls', 'shoulders', 'rear delts', 'cable', 'beginner', ARRAY['Cable at face height', 'Pull to face with elbows high', 'Squeeze shoulder blades']),
('Arnold Press', 'shoulders', 'shoulders', 'dumbbell', 'intermediate', ARRAY['Start with palms facing you', 'Rotate as you press up', 'Reverse on the way down']),

-- Arm exercises
('Barbell Curl', 'arms', 'biceps', 'barbell', 'beginner', ARRAY['Stand with bar at arms length', 'Curl to chest', 'Lower with control']),
('Hammer Curls', 'arms', 'biceps', 'dumbbell', 'beginner', ARRAY['Hold dumbbells with neutral grip', 'Curl without rotating', 'Lower with control']),
('Preacher Curls', 'arms', 'biceps', 'barbell', 'intermediate', ARRAY['Arms on preacher pad', 'Curl bar up', 'Lower until arms nearly straight']),
('Tricep Extensions', 'arms', 'triceps', 'dumbbell', 'beginner', ARRAY['Dumbbell overhead', 'Lower behind head', 'Extend back up']),
('Close-Grip Bench', 'arms', 'triceps', 'barbell', 'intermediate', ARRAY['Grip bar shoulder width', 'Lower to chest', 'Press focusing on triceps']),
('Cable Pushdowns', 'arms', 'triceps', 'cable', 'beginner', ARRAY['Cable at chest height', 'Push down until arms straight', 'Control the return']),

-- Core exercises
('Plank', 'core', 'abs', 'bodyweight', 'beginner', ARRAY['Forearms on ground', 'Body straight line', 'Hold position']),
('Crunches', 'core', 'abs', 'bodyweight', 'beginner', ARRAY['Lie on back', 'Curl shoulders off ground', 'Lower with control']),
('Russian Twists', 'core', 'obliques', 'bodyweight', 'intermediate', ARRAY['Sit with knees bent', 'Lean back slightly', 'Rotate side to side']),
('Hanging Knee Raises', 'core', 'abs', 'bodyweight', 'intermediate', ARRAY['Hang from bar', 'Raise knees to chest', 'Lower with control']),
('Ab Wheel', 'core', 'abs', 'none', 'advanced', ARRAY['Kneel with wheel', 'Roll forward', 'Pull back with abs']);

-- Insert sample workouts
INSERT INTO workouts (name, type, goal, duration_minutes, difficulty) VALUES
-- Build Muscle Workouts
('Chest & Triceps Blast', 'push', 'build_muscle', 60, 'intermediate'),
('Back & Biceps Builder', 'pull', 'build_muscle', 60, 'intermediate'),
('Leg Day Destroyer', 'legs', 'build_muscle', 75, 'intermediate'),
('Shoulder Sculptor', 'shoulders', 'build_muscle', 45, 'intermediate'),
('Arm Annihilation', 'arms', 'build_muscle', 45, 'intermediate'),

-- Strength Workouts
('Heavy Push Day', 'push', 'gain_strength', 90, 'advanced'),
('Heavy Pull Day', 'pull', 'gain_strength', 90, 'advanced'),
('Squat & Deadlift Power', 'legs', 'gain_strength', 90, 'advanced'),

-- Weight Loss Workouts
('Full Body HIIT', 'full_body', 'lose_weight', 30, 'beginner'),
('Upper Body Circuit', 'upper', 'lose_weight', 40, 'beginner'),
('Lower Body Circuit', 'lower', 'lose_weight', 40, 'beginner'),
('Core Crusher', 'core', 'lose_weight', 20, 'beginner');

-- Insert workout exercises for "Chest & Triceps Blast"
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index) VALUES
(1, (SELECT id FROM exercises WHERE name = 'Barbell Bench Press'), 4, '8-10', 120, 1),
(1, (SELECT id FROM exercises WHERE name = 'Incline Barbell Press'), 3, '10-12', 90, 2),
(1, (SELECT id FROM exercises WHERE name = 'Dumbbell Flyes'), 3, '12-15', 60, 3),
(1, (SELECT id FROM exercises WHERE name = 'Dips'), 3, '8-12', 90, 4),
(1, (SELECT id FROM exercises WHERE name = 'Close-Grip Bench'), 3, '10-12', 90, 5),
(1, (SELECT id FROM exercises WHERE name = 'Cable Pushdowns'), 3, '12-15', 60, 6);

-- Insert workout exercises for "Back & Biceps Builder"
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index) VALUES
(2, (SELECT id FROM exercises WHERE name = 'Deadlift'), 4, '6-8', 180, 1),
(2, (SELECT id FROM exercises WHERE name = 'Barbell Row'), 4, '8-10', 120, 2),
(2, (SELECT id FROM exercises WHERE name = 'Lat Pulldown'), 3, '10-12', 90, 3),
(2, (SELECT id FROM exercises WHERE name = 'Dumbbell Row'), 3, '12-15', 60, 4),
(2, (SELECT id FROM exercises WHERE name = 'Barbell Curl'), 3, '10-12', 90, 5),
(2, (SELECT id FROM exercises WHERE name = 'Hammer Curls'), 3, '12-15', 60, 6);

-- Insert workout exercises for "Full Body HIIT"
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, rest_seconds, order_index, notes) VALUES
(9, (SELECT id FROM exercises WHERE name = 'Goblet Squat'), 3, '20', 30, 1, 'Go fast!'),
(9, (SELECT id FROM exercises WHERE name = 'Push-ups'), 3, '15', 30, 2, 'Modify on knees if needed'),
(9, (SELECT id FROM exercises WHERE name = 'Walking Lunges'), 3, '20', 30, 3, '10 each leg'),
(9, (SELECT id FROM exercises WHERE name = 'Plank'), 3, '30-60', 30, 4, 'Hold for time in seconds'),
(9, (SELECT id FROM exercises WHERE name = 'Russian Twists'), 3, '20', 30, 5, 'Fast pace');

-- Function to generate a week of workouts for a user based on their goal
CREATE OR REPLACE FUNCTION generate_week_workouts(p_user_id UUID, p_goal TEXT)
RETURNS VOID AS $$
DECLARE
  v_workout_id INTEGER;
  v_date DATE := CURRENT_DATE;
  v_day INTEGER := 0;
BEGIN
  -- Delete any existing future workouts
  DELETE FROM user_workouts
  WHERE user_id = p_user_id
  AND scheduled_date >= CURRENT_DATE
  AND completed = FALSE;

  -- Generate 7 days of workouts based on goal
  WHILE v_day < 7 LOOP
    -- Select appropriate workout based on day and goal
    IF p_goal = 'build_muscle' THEN
      CASE v_day % 4
        WHEN 0 THEN
          SELECT id INTO v_workout_id FROM workouts
          WHERE type = 'push' AND goal IN ('build_muscle', 'all')
          ORDER BY RANDOM() LIMIT 1;
        WHEN 1 THEN
          SELECT id INTO v_workout_id FROM workouts
          WHERE type = 'pull' AND goal IN ('build_muscle', 'all')
          ORDER BY RANDOM() LIMIT 1;
        WHEN 2 THEN
          v_workout_id := NULL; -- Rest day
        WHEN 3 THEN
          SELECT id INTO v_workout_id FROM workouts
          WHERE type = 'legs' AND goal IN ('build_muscle', 'all')
          ORDER BY RANDOM() LIMIT 1;
      END CASE;
    ELSIF p_goal = 'lose_weight' THEN
      IF v_day % 7 IN (0, 2, 4) THEN
        SELECT id INTO v_workout_id FROM workouts
        WHERE goal IN ('lose_weight', 'all')
        ORDER BY RANDOM() LIMIT 1;
      ELSE
        v_workout_id := NULL; -- Active rest day
      END IF;
    ELSIF p_goal = 'gain_strength' THEN
      CASE v_day % 4
        WHEN 0 THEN
          SELECT id INTO v_workout_id FROM workouts
          WHERE type IN ('push', 'upper') AND goal IN ('gain_strength', 'all')
          ORDER BY RANDOM() LIMIT 1;
        WHEN 1 THEN
          v_workout_id := NULL; -- Rest day
        WHEN 2 THEN
          SELECT id INTO v_workout_id FROM workouts
          WHERE type IN ('pull', 'upper') AND goal IN ('gain_strength', 'all')
          ORDER BY RANDOM() LIMIT 1;
        WHEN 3 THEN
          SELECT id INTO v_workout_id FROM workouts
          WHERE type = 'legs' AND goal IN ('gain_strength', 'all')
          ORDER BY RANDOM() LIMIT 1;
      END CASE;
    END IF;

    -- Insert workout if not a rest day
    IF v_workout_id IS NOT NULL THEN
      INSERT INTO user_workouts (user_id, workout_id, scheduled_date)
      VALUES (p_user_id, v_workout_id, v_date)
      ON CONFLICT (user_id, scheduled_date) DO NOTHING;
    END IF;

    v_date := v_date + INTERVAL '1 day';
    v_day := v_day + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;