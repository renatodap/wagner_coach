-- ============================================================
-- ENHANCED ONBOARDING SCHEMA
-- Migration: 20251002_enhanced_onboarding
-- Changes:
-- - Remove program_duration_weeks (AI determines duration)
-- - Add facility_access for sports/training locations
-- - Add city for location-based recommendations
-- - Add location_permission for weather/outdoor activity planning
-- ============================================================

-- Drop program_duration_weeks constraint and column
ALTER TABLE user_onboarding
DROP CONSTRAINT IF EXISTS user_onboarding_program_duration_weeks_check;

ALTER TABLE user_onboarding
DROP COLUMN IF EXISTS program_duration_weeks;

-- Add new location and facility fields
ALTER TABLE user_onboarding
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS location_permission BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS facility_access TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add comments for new fields
COMMENT ON COLUMN user_onboarding.city IS 'User city for weather data and local facility recommendations';
COMMENT ON COLUMN user_onboarding.location_permission IS 'Permission to use location for weather-aware programming';
COMMENT ON COLUMN user_onboarding.facility_access IS 'Available facilities: gym, tennis_courts, soccer_field, basketball_court, swimming_pool, track_indoor, track_outdoor, climbing_gym, yoga_studio, home_gym, etc.';

-- Update the generate_profile_text function to exclude program_duration_weeks
CREATE OR REPLACE FUNCTION generate_profile_text(user_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  profile_text TEXT;
  onboarding_data RECORD;
BEGIN
  SELECT * INTO onboarding_data FROM user_onboarding WHERE user_id = user_id_param;

  profile_text := format(
    'Goal: %s. Persona: %s. Activity Level: %s. Training Frequency: %s days/week. Sex: %s. Age: %s. Weight: %skg. Height: %scm. Meals per day: %s. City: %s. Location Permission: %s. Facilities: %s. Training Times: %s. Dietary Restrictions: %s. Equipment: %s. Injuries: %s. Experience: %s.',
    onboarding_data.primary_goal,
    onboarding_data.user_persona,
    onboarding_data.current_activity_level,
    onboarding_data.desired_training_frequency,
    onboarding_data.biological_sex,
    onboarding_data.age,
    onboarding_data.current_weight_kg,
    onboarding_data.height_cm,
    onboarding_data.daily_meal_preference,
    COALESCE(onboarding_data.city, 'Not specified'),
    onboarding_data.location_permission,
    array_to_string(onboarding_data.facility_access, ', '),
    array_to_string(onboarding_data.training_time_preferences, ', '),
    array_to_string(onboarding_data.dietary_restrictions, ', '),
    array_to_string(onboarding_data.equipment_access, ', '),
    array_to_string(onboarding_data.injury_limitations, ', '),
    onboarding_data.experience_level
  );

  RETURN profile_text;
END;
$$ LANGUAGE plpgsql;
