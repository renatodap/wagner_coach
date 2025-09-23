-- Legs and Shoulders Exercises
-- This file contains all leg and shoulder exercise variations

-- LEG EXERCISES

-- Barbell Leg Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Barbell Back Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Front Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 4, true),
('Barbell Box Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Pause Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell High Bar Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Low Bar Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Overhead Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 5, true),
('Barbell Zercher Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 4, true),
('Barbell Hack Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Bulgarian Split Squat', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Lunges', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Walking Lunges', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Reverse Lunges', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Step-ups', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 3, true),
('Barbell Hip Thrust', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Glutes'), 'compound', 'push', 'lying_flat', 2, true),
('Barbell Glute Bridge', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Glutes'), 'compound', 'push', 'lying_flat', 2, true),
('Barbell Calf Raise', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Calves'), 'isolation', 'push', 'standing', 2, true),
('Barbell Seated Calf Raise', get_category_id('Legs'), get_equipment_id('Barbell'), get_muscle_id('Calves'), 'isolation', 'push', 'seated', 2, true);

-- Dumbbell Leg Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public, is_unilateral) VALUES
('Dumbbell Goblet Squat', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, false),
('Dumbbell Front Squat', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, false),
('Dumbbell Bulgarian Split Squat', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, true),
('Dumbbell Split Squat', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, true),
('Dumbbell Lunges', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, true),
('Dumbbell Walking Lunges', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, true),
('Dumbbell Reverse Lunges', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, true),
('Dumbbell Lateral Lunges', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, true),
('Dumbbell Curtsy Lunges', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Glutes'), 'compound', 'push', 'standing', 2, true, true),
('Dumbbell Step-ups', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, true),
('Dumbbell Single-Leg Squat', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 4, true, true),
('Dumbbell Pistol Squat', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 5, true, true),
('Dumbbell Sumo Squat', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true, false),
('Dumbbell Calf Raise', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Calves'), 'isolation', 'push', 'standing', 1, true, false),
('Single-Leg Dumbbell Calf Raise', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Calves'), 'isolation', 'push', 'standing', 2, true, true),
('Dumbbell Wall Sit', get_category_id('Legs'), get_equipment_id('Dumbbell'), get_muscle_id('Quadriceps'), 'isometric', 'static', 'seated', 2, true, false);

-- Machine Leg Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Leg Press', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Quadriceps'), 'compound', 'push', 'seated', 1, true),
('45° Leg Press', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Quadriceps'), 'compound', 'push', 'lying_incline', 1, true),
('Single-Leg Press', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Quadriceps'), 'compound', 'push', 'seated', 2, true),
('Wide-Stance Leg Press', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Quadriceps'), 'compound', 'push', 'seated', 1, true),
('Narrow-Stance Leg Press', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Quadriceps'), 'compound', 'push', 'seated', 1, true),
('High Foot Placement Leg Press', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Glutes'), 'compound', 'push', 'seated', 1, true),
('Low Foot Placement Leg Press', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Quadriceps'), 'compound', 'push', 'seated', 1, true),
('Hack Squat Machine', get_category_id('Legs'), get_equipment_id('Hack Squat'), get_muscle_id('Quadriceps'), 'compound', 'push', 'lying_incline', 2, true),
('Reverse Hack Squat', get_category_id('Legs'), get_equipment_id('Hack Squat'), get_muscle_id('Glutes'), 'compound', 'push', 'lying_decline', 2, true),
('Leg Extension', get_category_id('Legs'), get_equipment_id('Leg Extension'), get_muscle_id('Quadriceps'), 'isolation', 'push', 'seated', 1, true),
('Single-Leg Extension', get_category_id('Legs'), get_equipment_id('Leg Extension'), get_muscle_id('Quadriceps'), 'isolation', 'push', 'seated', 1, true),
('Leg Curl', get_category_id('Legs'), get_equipment_id('Leg Curl'), get_muscle_id('Hamstrings'), 'isolation', 'pull', 'lying_flat', 1, true),
('Seated Leg Curl', get_category_id('Legs'), get_equipment_id('Leg Curl'), get_muscle_id('Hamstrings'), 'isolation', 'pull', 'seated', 1, true),
('Standing Leg Curl', get_category_id('Legs'), get_equipment_id('Leg Curl'), get_muscle_id('Hamstrings'), 'isolation', 'pull', 'standing', 1, true),
('Single-Leg Curl', get_category_id('Legs'), get_equipment_id('Leg Curl'), get_muscle_id('Hamstrings'), 'isolation', 'pull', 'lying_flat', 1, true),
('Machine Calf Raise', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Calves'), 'isolation', 'push', 'standing', 1, true),
('Seated Calf Raise Machine', get_category_id('Legs'), get_equipment_id('Leg Press'), get_muscle_id('Calves'), 'isolation', 'push', 'seated', 1, true),
('Smith Machine Squat', get_category_id('Legs'), get_equipment_id('Smith Machine'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true),
('Smith Machine Front Squat', get_category_id('Legs'), get_equipment_id('Smith Machine'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true),
('Smith Machine Split Squat', get_category_id('Legs'), get_equipment_id('Smith Machine'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true),
('Smith Machine Lunges', get_category_id('Legs'), get_equipment_id('Smith Machine'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true),
('Smith Machine Calf Raise', get_category_id('Legs'), get_equipment_id('Smith Machine'), get_muscle_id('Calves'), 'isolation', 'push', 'standing', 1, true);

-- Cable Leg Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Cable Squat', get_category_id('Legs'), get_equipment_id('Cable'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', 2, true),
('Cable Pull-Through', get_category_id('Legs'), get_equipment_id('Cable'), get_muscle_id('Glutes'), 'compound', 'pull', 'standing', 2, true),
('Cable Hip Abduction', get_category_id('Legs'), get_equipment_id('Cable'), get_muscle_id('Abductors'), 'isolation', 'pull', 'standing', 1, true),
('Cable Hip Adduction', get_category_id('Legs'), get_equipment_id('Cable'), get_muscle_id('Adductors'), 'isolation', 'pull', 'standing', 1, true),
('Cable Kickbacks', get_category_id('Legs'), get_equipment_id('Cable'), get_muscle_id('Glutes'), 'isolation', 'push', 'standing', 1, true),
('Cable Leg Curl', get_category_id('Legs'), get_equipment_id('Cable'), get_muscle_id('Hamstrings'), 'isolation', 'pull', 'standing', 2, true),
('Cable Romanian Deadlift', get_category_id('Legs'), get_equipment_id('Cable'), get_muscle_id('Hamstrings'), 'compound', 'pull', 'standing', 2, true);

-- Bodyweight Leg Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, is_bodyweight, difficulty_level, is_public) VALUES
('Bodyweight Squat', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', true, 1, true),
('Jump Squat', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'plyometric', 'push', 'standing', true, 2, true),
('Pistol Squat', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', true, 5, true),
('Shrimp Squat', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', true, 4, true),
('Bulgarian Split Squat', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', true, 2, true),
('Lunges', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'compound', 'push', 'standing', true, 1, true),
('Jump Lunges', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'plyometric', 'push', 'standing', true, 3, true),
('Wall Sit', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'isometric', 'static', 'seated', true, 1, true),
('Single-Leg Glute Bridge', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Glutes'), 'compound', 'push', 'lying_flat', true, 2, true),
('Glute Bridge', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Glutes'), 'compound', 'push', 'lying_flat', true, 1, true),
('Box Jumps', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'plyometric', 'push', 'standing', true, 3, true),
('Broad Jumps', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Quadriceps'), 'plyometric', 'push', 'standing', true, 2, true),
('Calf Raise', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Calves'), 'isolation', 'push', 'standing', true, 1, true),
('Single-Leg Calf Raise', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Calves'), 'isolation', 'push', 'standing', true, 2, true),
('Nordic Curls', get_category_id('Legs'), get_equipment_id('Bodyweight'), get_muscle_id('Hamstrings'), 'isolation', 'pull', 'kneeling', true, 4, true);

-- SHOULDER EXERCISES

-- Barbell Shoulder Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Barbell Overhead Press', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', 'overhand', 3, true),
('Barbell Military Press', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', 'overhand', 3, true),
('Barbell Push Press', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', 'overhand', 3, true),
('Barbell Behind Neck Press', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 'overhand', 3, true),
('Barbell Seated Press', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 'overhand', 2, true),
('Barbell Z-Press', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 'overhand', 4, true),
('Barbell Front Raise', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Front Delts'), 'isolation', 'push', 'standing', 'overhand', 2, true),
('Barbell Upright Row', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Middle Delts'), 'compound', 'pull', 'standing', 'overhand', 2, true),
('Barbell High Pull', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Shoulders'), 'compound', 'pull', 'standing', 'overhand', 3, true),
('Barbell Face Pull', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', 'overhand', 2, true),
('Barbell Bradford Press', get_category_id('Shoulders'), get_equipment_id('Barbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', 'overhand', 3, true),
('Barbell Landmine Press', get_category_id('Shoulders'), get_equipment_id('Landmine'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', 'neutral', 2, true);

-- Dumbbell Shoulder Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public, is_unilateral) VALUES
('Dumbbell Shoulder Press', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 'neutral', 2, true, false),
('Dumbbell Military Press', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', 'neutral', 2, true, false),
('Dumbbell Arnold Press', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 'neutral', 3, true, false),
('Single-Arm Dumbbell Press', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', 'neutral', 3, true, true),
('Dumbbell Z-Press', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 'neutral', 4, true, false),
('Dumbbell Lateral Raise', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Middle Delts'), 'isolation', 'push', 'standing', 'neutral', 1, true, false),
('Dumbbell Front Raise', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Front Delts'), 'isolation', 'push', 'standing', 'neutral', 1, true, false),
('Dumbbell Rear Delt Fly', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', 'neutral', 2, true, false),
('Bent-Over Dumbbell Lateral Raise', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', 'neutral', 2, true, false),
('Dumbbell Upright Row', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Middle Delts'), 'compound', 'pull', 'standing', 'neutral', 2, true, false),
('Dumbbell Y-Raise', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Middle Delts'), 'isolation', 'push', 'lying_incline', 'neutral', 2, true, false),
('Dumbbell T-Raise', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Middle Delts'), 'isolation', 'push', 'lying_incline', 'neutral', 2, true, false),
('Dumbbell W-Raise', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'lying_incline', 'neutral', 2, true, false),
('Dumbbell Cuban Press', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', 'neutral', 3, true, false),
('Dumbbell Bus Driver', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Front Delts'), 'isolation', 'rotation', 'standing', 'neutral', 2, true, false),
('Dumbbell Scaption', get_category_id('Shoulders'), get_equipment_id('Dumbbell'), get_muscle_id('Middle Delts'), 'isolation', 'push', 'standing', 'neutral', 2, true, false);

-- Cable Shoulder Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Cable Lateral Raise', get_category_id('Shoulders'), get_equipment_id('Cable'), get_muscle_id('Middle Delts'), 'isolation', 'push', 'standing', 'neutral', 1, true),
('Cable Front Raise', get_category_id('Shoulders'), get_equipment_id('Cable'), get_muscle_id('Front Delts'), 'isolation', 'push', 'standing', 'overhand', 1, true),
('Cable Rear Delt Fly', get_category_id('Shoulders'), get_equipment_id('Cable'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', 'neutral', 2, true),
('Cable Face Pull', get_category_id('Shoulders'), get_equipment_id('Cable'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', 'overhand', 2, true),
('Cable Upright Row', get_category_id('Shoulders'), get_equipment_id('Cable'), get_muscle_id('Middle Delts'), 'compound', 'pull', 'standing', 'overhand', 2, true),
('Single-Arm Cable Lateral Raise', get_category_id('Shoulders'), get_equipment_id('Cable'), get_muscle_id('Middle Delts'), 'isolation', 'push', 'standing', 'neutral', 1, true),
('Cable Y-Raise', get_category_id('Shoulders'), get_equipment_id('Cable'), get_muscle_id('Middle Delts'), 'isolation', 'push', 'standing', 'neutral', 2, true),
('Cable Shoulder Press', get_category_id('Shoulders'), get_equipment_id('Cable'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 'neutral', 2, true);

-- Machine Shoulder Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Machine Shoulder Press', get_category_id('Shoulders'), get_equipment_id('Shoulder Press Machine'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 1, true),
('Machine Lateral Raise', get_category_id('Shoulders'), get_equipment_id('Shoulder Press Machine'), get_muscle_id('Middle Delts'), 'isolation', 'push', 'seated', 1, true),
('Machine Rear Delt Fly', get_category_id('Shoulders'), get_equipment_id('Pec Deck'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'seated', 1, true),
('Smith Machine Shoulder Press', get_category_id('Shoulders'), get_equipment_id('Smith Machine'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 2, true),
('Smith Machine Behind Neck Press', get_category_id('Shoulders'), get_equipment_id('Smith Machine'), get_muscle_id('Shoulders'), 'compound', 'push', 'seated', 2, true),
('Smith Machine Upright Row', get_category_id('Shoulders'), get_equipment_id('Smith Machine'), get_muscle_id('Middle Delts'), 'compound', 'pull', 'standing', 2, true);

-- Bodyweight Shoulder Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, is_bodyweight, difficulty_level, is_public) VALUES
('Pike Push-ups', get_category_id('Shoulders'), get_equipment_id('Bodyweight'), get_muscle_id('Shoulders'), 'compound', 'push', 'lying_incline', true, 2, true),
('Handstand Push-ups', get_category_id('Shoulders'), get_equipment_id('Bodyweight'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', true, 5, true),
('Wall Handstand Push-ups', get_category_id('Shoulders'), get_equipment_id('Bodyweight'), get_muscle_id('Shoulders'), 'compound', 'push', 'standing', true, 4, true),
('Pseudo Planche Push-ups', get_category_id('Shoulders'), get_equipment_id('Bodyweight'), get_muscle_id('Front Delts'), 'compound', 'push', 'lying_flat', true, 4, true),
('Band Pull-aparts', get_category_id('Shoulders'), get_equipment_id('Resistance Band'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', true, 1, true),
('Face Pulls', get_category_id('Shoulders'), get_equipment_id('Resistance Band'), get_muscle_id('Rear Delts'), 'isolation', 'pull', 'standing', true, 1, true);