-- Chest and Back Exercises
-- This file contains all chest and back exercise variations

-- Helper function to get IDs
CREATE OR REPLACE FUNCTION get_muscle_id(muscle_name TEXT)
RETURNS UUID AS $$
  SELECT id FROM muscle_groups WHERE name = muscle_name;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION get_equipment_id(equipment_name TEXT)
RETURNS UUID AS $$
  SELECT id FROM equipment_types WHERE name = equipment_name;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION get_category_id(category_name TEXT)
RETURNS UUID AS $$
  SELECT id FROM exercise_categories WHERE name = category_name;
$$ LANGUAGE SQL;

-- CHEST EXERCISES

-- Barbell Chest Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, incline_angle, difficulty_level, is_public) VALUES
('Barbell Bench Press', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'overhand', 0, 3, true),
('Barbell Incline Bench Press', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_incline', 'overhand', 30, 3, true),
('Barbell Incline Bench Press 45°', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_incline', 'overhand', 45, 3, true),
('Barbell Decline Bench Press', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_decline', 'overhand', -15, 3, true),
('Barbell Close-Grip Bench Press', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'narrow', 0, 3, true),
('Barbell Wide-Grip Bench Press', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'wide', 0, 3, true),
('Barbell Floor Press', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'overhand', 0, 2, true),
('Barbell Guillotine Press', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'overhand', 0, 4, true),
('Barbell Pullover', get_category_id('Chest'), get_equipment_id('Barbell'), get_muscle_id('Chest'), 'isolation', 'pull', 'lying_flat', 'overhand', 0, 3, true);

-- Dumbbell Chest Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, incline_angle, difficulty_level, is_public) VALUES
('Dumbbell Bench Press', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'neutral', 0, 2, true),
('Dumbbell Incline Bench Press', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_incline', 'neutral', 30, 2, true),
('Dumbbell Incline Bench Press 45°', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_incline', 'neutral', 45, 2, true),
('Dumbbell Decline Bench Press', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_decline', 'neutral', -15, 2, true),
('Dumbbell Flyes', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'isolation', 'push', 'lying_flat', 'neutral', 0, 2, true),
('Dumbbell Incline Flyes', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'isolation', 'push', 'lying_incline', 'neutral', 30, 2, true),
('Dumbbell Decline Flyes', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'isolation', 'push', 'lying_decline', 'neutral', -15, 2, true),
('Dumbbell Pullover', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'isolation', 'pull', 'lying_flat', 'neutral', 0, 2, true),
('Dumbbell Squeeze Press', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'neutral', 0, 2, true),
('Dumbbell Hex Press', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'neutral', 0, 2, true),
('Single-Arm Dumbbell Press', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'neutral', 0, 3, true),
('Alternating Dumbbell Press', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'neutral', 0, 3, true),
('Dumbbell Floor Press', get_category_id('Chest'), get_equipment_id('Dumbbell'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 'neutral', 0, 2, true);

-- Cable Chest Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, incline_angle, difficulty_level, is_public) VALUES
('Cable Crossover', get_category_id('Chest'), get_equipment_id('Cable'), get_muscle_id('Chest'), 'isolation', 'push', 'standing', 'overhand', 0, 2, true),
('Low Cable Crossover', get_category_id('Chest'), get_equipment_id('Cable'), get_muscle_id('Chest'), 'isolation', 'push', 'standing', 'overhand', 0, 2, true),
('High Cable Crossover', get_category_id('Chest'), get_equipment_id('Cable'), get_muscle_id('Chest'), 'isolation', 'push', 'standing', 'overhand', 0, 2, true),
('Cable Chest Press', get_category_id('Chest'), get_equipment_id('Cable'), get_muscle_id('Chest'), 'compound', 'push', 'standing', 'neutral', 0, 2, true),
('Incline Cable Flyes', get_category_id('Chest'), get_equipment_id('Cable'), get_muscle_id('Chest'), 'isolation', 'push', 'lying_incline', 'neutral', 30, 2, true),
('Cable Pullover', get_category_id('Chest'), get_equipment_id('Cable'), get_muscle_id('Chest'), 'isolation', 'pull', 'standing', 'overhand', 0, 2, true),
('Single-Arm Cable Press', get_category_id('Chest'), get_equipment_id('Cable'), get_muscle_id('Chest'), 'compound', 'push', 'standing', 'neutral', 0, 2, true),
('Cable Iron Cross', get_category_id('Chest'), get_equipment_id('Cable'), get_muscle_id('Chest'), 'isolation', 'push', 'standing', 'neutral', 0, 3, true);

-- Bodyweight Chest Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, is_bodyweight, difficulty_level, is_public) VALUES
('Push-ups', get_category_id('Chest'), get_equipment_id('Bodyweight'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', true, 1, true),
('Wide-Grip Push-ups', get_category_id('Chest'), get_equipment_id('Bodyweight'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', true, 1, true),
('Diamond Push-ups', get_category_id('Chest'), get_equipment_id('Bodyweight'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', true, 2, true),
('Decline Push-ups', get_category_id('Chest'), get_equipment_id('Bodyweight'), get_muscle_id('Chest'), 'compound', 'push', 'lying_decline', true, 2, true),
('Incline Push-ups', get_category_id('Chest'), get_equipment_id('Bodyweight'), get_muscle_id('Chest'), 'compound', 'push', 'lying_incline', true, 1, true),
('Clap Push-ups', get_category_id('Chest'), get_equipment_id('Bodyweight'), get_muscle_id('Chest'), 'plyometric', 'push', 'lying_flat', true, 3, true),
('Archer Push-ups', get_category_id('Chest'), get_equipment_id('Bodyweight'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', true, 3, true),
('Hindu Push-ups', get_category_id('Chest'), get_equipment_id('Bodyweight'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', true, 2, true),
('Dips', get_category_id('Chest'), get_equipment_id('Dip Bars'), get_muscle_id('Chest'), 'compound', 'push', 'hanging', true, 3, true),
('Weighted Dips', get_category_id('Chest'), get_equipment_id('Dip Bars'), get_muscle_id('Chest'), 'compound', 'push', 'hanging', false, 4, true),
('Ring Dips', get_category_id('Chest'), get_equipment_id('Gymnastics Rings'), get_muscle_id('Chest'), 'compound', 'push', 'hanging', true, 4, true);

-- Machine Chest Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Chest Press Machine', get_category_id('Chest'), get_equipment_id('Chest Press Machine'), get_muscle_id('Chest'), 'compound', 'push', 'seated', 1, true),
('Incline Chest Press Machine', get_category_id('Chest'), get_equipment_id('Chest Press Machine'), get_muscle_id('Chest'), 'compound', 'push', 'seated', 1, true),
('Decline Chest Press Machine', get_category_id('Chest'), get_equipment_id('Chest Press Machine'), get_muscle_id('Chest'), 'compound', 'push', 'seated', 1, true),
('Pec Deck Machine', get_category_id('Chest'), get_equipment_id('Pec Deck'), get_muscle_id('Chest'), 'isolation', 'push', 'seated', 1, true),
('Smith Machine Bench Press', get_category_id('Chest'), get_equipment_id('Smith Machine'), get_muscle_id('Chest'), 'compound', 'push', 'lying_flat', 2, true),
('Smith Machine Incline Press', get_category_id('Chest'), get_equipment_id('Smith Machine'), get_muscle_id('Chest'), 'compound', 'push', 'lying_incline', 2, true),
('Smith Machine Decline Press', get_category_id('Chest'), get_equipment_id('Smith Machine'), get_muscle_id('Chest'), 'compound', 'push', 'lying_decline', 2, true);

-- BACK EXERCISES

-- Barbell Back Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Barbell Bent-Over Row', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'overhand', 3, true),
('Barbell Bent-Over Row Underhand', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'underhand', 3, true),
('Barbell Pendlay Row', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'overhand', 3, true),
('Barbell T-Bar Row', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'neutral', 3, true),
('Barbell Seal Row', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'lying_flat', 'overhand', 3, true),
('Barbell Upright Row', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Traps'), 'compound', 'pull', 'standing', 'overhand', 2, true),
('Barbell Shrugs', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Traps'), 'isolation', 'pull', 'standing', 'overhand', 1, true),
('Barbell Behind-Back Shrugs', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Traps'), 'isolation', 'pull', 'standing', 'overhand', 2, true),
('Barbell Rack Pull', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'overhand', 3, true),
('Barbell Deadlift', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'overhand', 4, true),
('Barbell Romanian Deadlift', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'overhand', 3, true),
('Barbell Stiff-Leg Deadlift', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'overhand', 3, true),
('Barbell Good Morning', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Lower Back'), 'compound', 'pull', 'standing', 'overhand', 3, true);

-- Dumbbell Back Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public, is_unilateral) VALUES
('Dumbbell Row', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'neutral', 2, true, true),
('Dumbbell Bent-Over Row', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'neutral', 2, true, false),
('Dumbbell Chest-Supported Row', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'lying_incline', 'neutral', 2, true, false),
('Dumbbell Seal Row', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'lying_flat', 'neutral', 2, true, false),
('Single-Arm Dumbbell Row', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'neutral', 2, true, true),
('Dumbbell Kroc Row', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'neutral', 3, true, true),
('Dumbbell Shrugs', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Traps'), 'isolation', 'pull', 'standing', 'neutral', 1, true, false),
('Dumbbell Upright Row', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Traps'), 'compound', 'pull', 'standing', 'neutral', 2, true, false),
('Dumbbell Deadlift', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'neutral', 2, true, false),
('Dumbbell Romanian Deadlift', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'neutral', 2, true, false),
('Single-Leg Dumbbell Deadlift', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 'neutral', 3, true, true),
('Dumbbell Reverse Fly', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', 'neutral', 2, true, false),
('Dumbbell Incline Row', get_category_id('Back'), get_equipment_id('Dumbbell'), get_muscle_id('Back'), 'compound', 'pull', 'lying_incline', 'neutral', 2, true, false);

-- Cable Back Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Cable Row', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Back'), 'compound', 'pull', 'seated', 'neutral', 1, true),
('Wide-Grip Cable Row', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Back'), 'compound', 'pull', 'seated', 'wide', 1, true),
('Close-Grip Cable Row', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Back'), 'compound', 'pull', 'seated', 'narrow', 1, true),
('Single-Arm Cable Row', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Back'), 'compound', 'pull', 'seated', 'neutral', 2, true),
('Cable Face Pull', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', 'overhand', 2, true),
('Cable Reverse Fly', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', 'neutral', 2, true),
('Cable Shrugs', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Traps'), 'isolation', 'pull', 'standing', 'overhand', 1, true),
('Cable Upright Row', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Traps'), 'compound', 'pull', 'standing', 'overhand', 2, true),
('Lat Pulldown', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Lats'), 'compound', 'pull', 'seated', 'overhand', 2, true),
('Wide-Grip Lat Pulldown', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Lats'), 'compound', 'pull', 'seated', 'wide', 2, true),
('Close-Grip Lat Pulldown', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Lats'), 'compound', 'pull', 'seated', 'narrow', 2, true),
('Underhand Lat Pulldown', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Lats'), 'compound', 'pull', 'seated', 'underhand', 2, true),
('Behind-Neck Lat Pulldown', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Lats'), 'compound', 'pull', 'seated', 'wide', 3, true),
('V-Bar Lat Pulldown', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Lats'), 'compound', 'pull', 'seated', 'neutral', 2, true),
('Straight-Arm Pulldown', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Lats'), 'isolation', 'pull', 'standing', 'overhand', 2, true),
('Cable Pullover', get_category_id('Back'), get_equipment_id('Cable'), get_muscle_id('Lats'), 'isolation', 'pull', 'standing', 'overhand', 2, true);

-- Bodyweight Back Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, is_bodyweight, difficulty_level, is_public) VALUES
('Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 3, true),
('Wide-Grip Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 3, true),
('Close-Grip Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 3, true),
('Chin-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 3, true),
('Neutral-Grip Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 3, true),
('Weighted Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', false, 4, true),
('Muscle-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 5, true),
('L-Sit Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 4, true),
('Commando Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 3, true),
('Archer Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Lats'), 'compound', 'pull', 'hanging', true, 4, true),
('Ring Rows', get_category_id('Back'), get_equipment_id('Gymnastics Rings'), get_muscle_id('Back'), 'compound', 'pull', 'lying_incline', true, 2, true),
('Inverted Rows', get_category_id('Back'), get_equipment_id('Barbell'), get_muscle_id('Back'), 'compound', 'pull', 'lying_incline', true, 2, true),
('Australian Pull-ups', get_category_id('Back'), get_equipment_id('Pull-up Bar'), get_muscle_id('Back'), 'compound', 'pull', 'lying_incline', true, 2, true);

-- Machine Back Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Machine Row', get_category_id('Back'), get_equipment_id('Row Machine'), get_muscle_id('Back'), 'compound', 'pull', 'seated', 1, true),
('Chest-Supported Machine Row', get_category_id('Back'), get_equipment_id('Row Machine'), get_muscle_id('Back'), 'compound', 'pull', 'lying_incline', 1, true),
('Machine Lat Pulldown', get_category_id('Back'), get_equipment_id('Lat Pulldown Machine'), get_muscle_id('Lats'), 'compound', 'pull', 'seated', 1, true),
('Machine Reverse Fly', get_category_id('Back'), get_equipment_id('Pec Deck'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'seated', 1, true),
('Machine Shrugs', get_category_id('Back'), get_equipment_id('Smith Machine'), get_muscle_id('Traps'), 'isolation', 'pull', 'standing', 1, true),
('Assisted Pull-up Machine', get_category_id('Back'), get_equipment_id('Lat Pulldown Machine'), get_muscle_id('Lats'), 'compound', 'pull', 'kneeling', 1, true),
('Smith Machine Row', get_category_id('Back'), get_equipment_id('Smith Machine'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 2, true),
('Smith Machine Deadlift', get_category_id('Back'), get_equipment_id('Smith Machine'), get_muscle_id('Back'), 'compound', 'pull', 'standing', 2, true);