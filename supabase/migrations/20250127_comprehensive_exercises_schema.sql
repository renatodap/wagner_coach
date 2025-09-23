-- Comprehensive Exercise Database Schema
-- This creates a complete exercise library with all equipment types and muscle groups

-- Drop existing tables to rebuild
DROP TABLE IF EXISTS workout_exercises CASCADE;
DROP TABLE IF EXISTS exercises CASCADE;
DROP TABLE IF EXISTS exercise_categories CASCADE;
DROP TABLE IF EXISTS equipment_types CASCADE;
DROP TABLE IF EXISTS muscle_groups CASCADE;

-- Create muscle groups table
CREATE TABLE muscle_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('upper', 'lower', 'core', 'full_body')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create equipment types table
CREATE TABLE equipment_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT CHECK (category IN ('free_weight', 'machine', 'cable', 'bodyweight', 'cardio', 'other')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exercise categories table
CREATE TABLE exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create comprehensive exercises table
CREATE TABLE exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic info
  name TEXT NOT NULL,
  category_id UUID REFERENCES exercise_categories(id),

  -- Equipment and position
  equipment_id UUID REFERENCES equipment_types(id),
  equipment_variant TEXT, -- specific variant like 'olympic_bar', 'ez_bar', 'trap_bar'

  -- Primary and secondary muscles
  primary_muscle_id UUID REFERENCES muscle_groups(id),
  secondary_muscles UUID[], -- Array of muscle group IDs

  -- Exercise details
  movement_type TEXT CHECK (movement_type IN ('compound', 'isolation', 'cardio', 'flexibility', 'plyometric', 'isometric')),
  force_type TEXT CHECK (force_type IN ('push', 'pull', 'static', 'dynamic', 'rotation')),
  mechanics_type TEXT CHECK (mechanics_type IN ('bilateral', 'unilateral', 'alternating')),

  -- Position and angle variations
  body_position TEXT CHECK (body_position IN ('standing', 'seated', 'lying_flat', 'lying_incline', 'lying_decline', 'kneeling', 'hanging', 'leaning')),
  grip_type TEXT CHECK (grip_type IN ('overhand', 'underhand', 'neutral', 'mixed', 'wide', 'narrow', 'standard', 'hammer', 'false', null)),
  incline_angle INTEGER CHECK (incline_angle BETWEEN -45 AND 90), -- degrees, negative for decline

  -- Instructions and media
  instructions TEXT[],
  tips TEXT[],
  common_mistakes TEXT[],
  video_url TEXT,
  image_urls TEXT[],

  -- Difficulty and accessibility
  difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
  is_bodyweight BOOLEAN DEFAULT false,
  requires_spotter BOOLEAN DEFAULT false,
  is_unilateral BOOLEAN DEFAULT false,

  -- User-created exercises
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,

  -- Metadata
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent exact duplicates
  UNIQUE(name, equipment_id, body_position, grip_type, incline_angle)
);

-- Create indexes for performance
CREATE INDEX idx_exercises_name ON exercises(name);
CREATE INDEX idx_exercises_primary_muscle ON exercises(primary_muscle_id);
CREATE INDEX idx_exercises_equipment ON exercises(equipment_id);
CREATE INDEX idx_exercises_category ON exercises(category_id);
CREATE INDEX idx_exercises_public ON exercises(is_public);
CREATE INDEX idx_exercises_created_by ON exercises(created_by);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public exercises are viewable by all" ON exercises
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own private exercises" ON exercises
  FOR SELECT USING (created_by = auth.uid() AND is_public = false);

CREATE POLICY "Users can create exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own exercises" ON exercises
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own exercises" ON exercises
  FOR DELETE USING (created_by = auth.uid());

-- Insert base muscle groups
INSERT INTO muscle_groups (name, category) VALUES
-- Upper body
('Chest', 'upper'),
('Back', 'upper'),
('Shoulders', 'upper'),
('Biceps', 'upper'),
('Triceps', 'upper'),
('Forearms', 'upper'),
('Traps', 'upper'),
('Lats', 'upper'),
('Rhomboids', 'upper'),
('Rear Delts', 'upper'),
('Front Delts', 'upper'),
('Middle Delts', 'upper'),
-- Lower body
('Quadriceps', 'lower'),
('Hamstrings', 'lower'),
('Glutes', 'lower'),
('Calves', 'lower'),
('Hip Flexors', 'lower'),
('Adductors', 'lower'),
('Abductors', 'lower'),
-- Core
('Abs', 'core'),
('Obliques', 'core'),
('Lower Back', 'core'),
('Transverse Abdominis', 'core'),
-- Full body
('Full Body', 'full_body'),
('Cardio', 'full_body');

-- Insert equipment types
INSERT INTO equipment_types (name, category) VALUES
-- Free weights
('Barbell', 'free_weight'),
('Dumbbell', 'free_weight'),
('Kettlebell', 'free_weight'),
('EZ Bar', 'free_weight'),
('Trap Bar', 'free_weight'),
('Weight Plate', 'free_weight'),
('Medicine Ball', 'free_weight'),
('Sandbag', 'free_weight'),
-- Machines
('Smith Machine', 'machine'),
('Leg Press', 'machine'),
('Hack Squat', 'machine'),
('Leg Extension', 'machine'),
('Leg Curl', 'machine'),
('Chest Press Machine', 'machine'),
('Shoulder Press Machine', 'machine'),
('Row Machine', 'machine'),
('Lat Pulldown Machine', 'machine'),
('Pec Deck', 'machine'),
('Cable Machine', 'machine'),
-- Cable specific
('Cable', 'cable'),
('Cable Crossover', 'cable'),
-- Bodyweight
('Bodyweight', 'bodyweight'),
('Pull-up Bar', 'bodyweight'),
('Dip Bars', 'bodyweight'),
('Suspension Trainer', 'bodyweight'),
('Gymnastics Rings', 'bodyweight'),
-- Cardio
('Treadmill', 'cardio'),
('Bike', 'cardio'),
('Rower', 'cardio'),
('Elliptical', 'cardio'),
('Stairmaster', 'cardio'),
('Assault Bike', 'cardio'),
('Ski Erg', 'cardio'),
-- Other
('Resistance Band', 'other'),
('Stability Ball', 'other'),
('Foam Roller', 'other'),
('Ab Wheel', 'other'),
('Battle Ropes', 'other'),
('Sled', 'other'),
('Landmine', 'other'),
('Bosu Ball', 'other');

-- Insert exercise categories
INSERT INTO exercise_categories (name, description) VALUES
('Chest', 'Chest exercises for pectoral development'),
('Back', 'Back exercises for lats, rhomboids, and traps'),
('Shoulders', 'Shoulder exercises for all three deltoid heads'),
('Arms', 'Biceps, triceps, and forearm exercises'),
('Legs', 'Quadriceps, hamstrings, glutes, and calves'),
('Core', 'Abs, obliques, and lower back exercises'),
('Olympic Lifts', 'Complex explosive movements'),
('Powerlifting', 'Squat, bench, deadlift variations'),
('Cardio', 'Cardiovascular and conditioning exercises'),
('Functional', 'Full body functional movements'),
('Stretching', 'Flexibility and mobility exercises'),
('Plyometric', 'Explosive jumping and power exercises');

-- Create function to update exercise popularity
CREATE OR REPLACE FUNCTION update_exercise_popularity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE exercises
  SET popularity_score = popularity_score + 1
  WHERE id = NEW.exercise_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;