-- Add missing columns to profiles table if they don't exist
DO $$
BEGIN
  -- Add age column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'age') THEN
    ALTER TABLE profiles ADD COLUMN age INTEGER CHECK (age >= 13 AND age <= 120);
  END IF;

  -- Add location column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
    ALTER TABLE profiles ADD COLUMN location TEXT;
  END IF;

  -- Add about_me column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'about_me') THEN
    ALTER TABLE profiles ADD COLUMN about_me TEXT;
  END IF;

  -- Add fitness_goals column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'fitness_goals') THEN
    ALTER TABLE profiles ADD COLUMN fitness_goals TEXT;
  END IF;

  -- Add experience_level column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'experience_level') THEN
    ALTER TABLE profiles ADD COLUMN experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'expert'));
  END IF;

  -- Add weekly_hours column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'weekly_hours') THEN
    ALTER TABLE profiles ADD COLUMN weekly_hours DECIMAL(4,1) CHECK (weekly_hours >= 0 AND weekly_hours <= 40);
  END IF;

  -- Add primary_goal column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'primary_goal') THEN
    ALTER TABLE profiles ADD COLUMN primary_goal TEXT;
  END IF;

  -- Add focus_areas column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'focus_areas') THEN
    ALTER TABLE profiles ADD COLUMN focus_areas TEXT[];
  END IF;

  -- Add health_conditions column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'health_conditions') THEN
    ALTER TABLE profiles ADD COLUMN health_conditions TEXT;
  END IF;

  -- Add dietary_preferences column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'dietary_preferences') THEN
    ALTER TABLE profiles ADD COLUMN dietary_preferences TEXT;
  END IF;

  -- Add equipment_access column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'equipment_access') THEN
    ALTER TABLE profiles ADD COLUMN equipment_access TEXT;
  END IF;

  -- Add preferred_workout_time column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'preferred_workout_time') THEN
    ALTER TABLE profiles ADD COLUMN preferred_workout_time TEXT;
  END IF;

  -- Add strengths column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'strengths') THEN
    ALTER TABLE profiles ADD COLUMN strengths TEXT;
  END IF;

  -- Add areas_for_improvement column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'areas_for_improvement') THEN
    ALTER TABLE profiles ADD COLUMN areas_for_improvement TEXT;
  END IF;

  -- Add goal column if it doesn't exist (for backward compatibility with settings)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'goal') THEN
    ALTER TABLE profiles ADD COLUMN goal TEXT CHECK (goal IN ('build_muscle', 'lose_weight', 'gain_strength'));
  END IF;
END $$;