-- Arms and Core Exercises
-- This file contains all arm (biceps, triceps, forearms) and core exercise variations

-- BICEPS EXERCISES

-- Barbell Biceps Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Barbell Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 2, true),
('Barbell Wide-Grip Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'wide', 2, true),
('Barbell Close-Grip Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'narrow', 2, true),
('Barbell Cheat Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 3, true),
('Barbell Drag Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 2, true),
('Barbell Preacher Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'seated', 'underhand', 2, true),
('Barbell Spider Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'lying_incline', 'underhand', 2, true),
('Barbell 21s', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 3, true),
('EZ-Bar Curl', get_category_id('Arms'), get_equipment_id('EZ Bar'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 2, true),
('EZ-Bar Preacher Curl', get_category_id('Arms'), get_equipment_id('EZ Bar'), get_muscle_id('Biceps'), 'isolation', 'pull', 'seated', 'underhand', 2, true),
('EZ-Bar Reverse Curl', get_category_id('Arms'), get_equipment_id('EZ Bar'), get_muscle_id('Forearms'), 'isolation', 'pull', 'standing', 'overhand', 2, true);

-- Dumbbell Biceps Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public, is_unilateral) VALUES
('Dumbbell Bicep Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 1, true, false),
('Dumbbell Hammer Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'neutral', 1, true, false),
('Dumbbell Alternating Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 1, true, false),
('Dumbbell Concentration Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'seated', 'underhand', 2, true, true),
('Dumbbell Preacher Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'seated', 'underhand', 2, true, true),
('Dumbbell Incline Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'lying_incline', 'underhand', 2, true, false),
('Dumbbell Spider Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'lying_incline', 'underhand', 2, true, false),
('Dumbbell Cross Body Hammer Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'neutral', 2, true, true),
('Dumbbell Zottman Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'neutral', 3, true, false),
('Dumbbell Waiter Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'neutral', 2, true, false),
('Dumbbell 21s', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 3, true, false),
('Seated Dumbbell Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Biceps'), 'isolation', 'pull', 'seated', 'underhand', 1, true, false),
('Dumbbell Reverse Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Forearms'), 'isolation', 'pull', 'standing', 'overhand', 2, true, false);

-- Cable Biceps Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Cable Bicep Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 1, true),
('Cable Hammer Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'neutral', 1, true),
('Cable Preacher Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Biceps'), 'isolation', 'pull', 'seated', 'underhand', 2, true),
('Cable Concentration Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Biceps'), 'isolation', 'pull', 'seated', 'underhand', 2, true),
('Cable Overhead Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 2, true),
('Cable Lying Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Biceps'), 'isolation', 'pull', 'lying_flat', 'underhand', 2, true),
('Cable Reverse Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Forearms'), 'isolation', 'pull', 'standing', 'overhand', 2, true),
('Single-Arm Cable Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 1, true),
('Cable Bayesian Curl', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Biceps'), 'isolation', 'pull', 'standing', 'underhand', 3, true);

-- TRICEPS EXERCISES

-- Barbell Triceps Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Barbell Skull Crusher', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'lying_flat', 'overhand', 2, true),
('Barbell Close-Grip Bench Press', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Triceps'), 'compound', 'push', 'lying_flat', 'narrow', 3, true),
('Barbell Overhead Tricep Extension', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'overhand', 2, true),
('Barbell JM Press', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'lying_flat', 'narrow', 3, true),
('EZ-Bar Skull Crusher', get_category_id('Arms'), get_equipment_id('EZ Bar'), get_muscle_id('Triceps'), 'isolation', 'push', 'lying_flat', 'overhand', 2, true),
('EZ-Bar Overhead Extension', get_category_id('Arms'), get_equipment_id('EZ Bar'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'overhand', 2, true);

-- Dumbbell Triceps Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public, is_unilateral) VALUES
('Dumbbell Skull Crusher', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'lying_flat', 'neutral', 2, true, false),
('Dumbbell Overhead Tricep Extension', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'seated', 'neutral', 2, true, false),
('Single-Arm Overhead Extension', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'seated', 'neutral', 2, true, true),
('Dumbbell Tricep Kickback', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'neutral', 1, true, true),
('Dumbbell Tate Press', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'lying_flat', 'neutral', 2, true, false),
('Dumbbell Close-Grip Press', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Triceps'), 'compound', 'push', 'lying_flat', 'neutral', 2, true, false),
('Dumbbell Floor Press', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Triceps'), 'compound', 'push', 'lying_flat', 'neutral', 2, true, false),
('Dumbbell Lying Tricep Extension', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Triceps'), 'isolation', 'push', 'lying_flat', 'neutral', 2, true, false);

-- Cable Triceps Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Cable Tricep Pushdown', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'overhand', 1, true),
('Cable Rope Pushdown', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'neutral', 1, true),
('Cable Overhead Extension', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'neutral', 2, true),
('Cable Kickback', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'neutral', 1, true),
('Single-Arm Cable Pushdown', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'neutral', 1, true),
('Cable Reverse-Grip Pushdown', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Triceps'), 'isolation', 'push', 'standing', 'underhand', 2, true),
('Cable Lying Tricep Extension', get_category_id('Arms'), get_equipment_id('Cable'), get_muscle_id('Triceps'), 'isolation', 'push', 'lying_flat', 'overhand', 2, true);

-- Bodyweight Triceps Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, is_bodyweight, difficulty_level, is_public) VALUES
('Tricep Dips', get_category_id('Arms'), get_equipment_id('Dip Bars'), get_muscle_id('Triceps'), 'compound', 'push', 'hanging', true, 3, true),
('Bench Dips', get_category_id('Arms'), get_equipment_id('Bodyweight'), get_muscle_id('Triceps'), 'compound', 'push', 'seated', true, 2, true),
('Diamond Push-ups', get_category_id('Arms'), get_equipment_id('Bodyweight'), get_muscle_id('Triceps'), 'compound', 'push', 'lying_flat', true, 2, true),
('Close-Grip Push-ups', get_category_id('Arms'), get_equipment_id('Bodyweight'), get_muscle_id('Triceps'), 'compound', 'push', 'lying_flat', true, 2, true),
('Tricep Push-ups', get_category_id('Arms'), get_equipment_id('Bodyweight'), get_muscle_id('Triceps'), 'compound', 'push', 'lying_flat', true, 2, true);

-- FOREARM EXERCISES
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, grip_type, difficulty_level, is_public) VALUES
('Barbell Wrist Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Forearms'), 'isolation', 'pull', 'seated', 'underhand', 1, true),
('Barbell Reverse Wrist Curl', get_category_id('Arms'), get_equipment_id('Barbell'), get_muscle_id('Forearms'), 'isolation', 'push', 'seated', 'overhand', 1, true),
('Dumbbell Wrist Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Forearms'), 'isolation', 'pull', 'seated', 'underhand', 1, true),
('Dumbbell Reverse Wrist Curl', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Forearms'), 'isolation', 'push', 'seated', 'overhand', 1, true),
('Farmer Walk', get_category_id('Arms'), get_equipment_id('Dumbbell'), get_muscle_id('Forearms'), 'compound', 'static', 'standing', 'neutral', 2, true),
('Dead Hang', get_category_id('Arms'), get_equipment_id('Pull-up Bar'), get_muscle_id('Forearms'), 'isometric', 'static', 'hanging', 'overhand', 1, true),
('Plate Pinch', get_category_id('Arms'), get_equipment_id('Weight Plate'), get_muscle_id('Forearms'), 'isometric', 'static', 'standing', 'neutral', 2, true);

-- CORE EXERCISES

-- Barbell Core Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Barbell Rollout', get_category_id('Core'), get_equipment_id('Barbell'), get_muscle_id('Abs'), 'compound', 'pull', 'kneeling', 3, true),
('Barbell Landmine 180', get_category_id('Core'), get_equipment_id('Landmine'), get_muscle_id('Obliques'), 'compound', 'rotation', 'standing', 3, true),
('Barbell Russian Twist', get_category_id('Core'), get_equipment_id('Barbell'), get_muscle_id('Obliques'), 'isolation', 'rotation', 'seated', 2, true),
('Barbell Sit-ups', get_category_id('Core'), get_equipment_id('Barbell'), get_muscle_id('Abs'), 'compound', 'pull', 'lying_flat', 2, true);

-- Dumbbell Core Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Dumbbell Side Bend', get_category_id('Core'), get_equipment_id('Dumbbell'), get_muscle_id('Obliques'), 'isolation', 'pull', 'standing', 1, true),
('Dumbbell Russian Twist', get_category_id('Core'), get_equipment_id('Dumbbell'), get_muscle_id('Obliques'), 'isolation', 'rotation', 'seated', 2, true),
('Dumbbell Woodchopper', get_category_id('Core'), get_equipment_id('Dumbbell'), get_muscle_id('Obliques'), 'compound', 'rotation', 'standing', 2, true),
('Dumbbell V-Sit', get_category_id('Core'), get_equipment_id('Dumbbell'), get_muscle_id('Abs'), 'compound', 'pull', 'seated', 2, true),
('Dumbbell Sit-ups', get_category_id('Core'), get_equipment_id('Dumbbell'), get_muscle_id('Abs'), 'compound', 'pull', 'lying_flat', 2, true);

-- Cable Core Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Cable Crunch', get_category_id('Core'), get_equipment_id('Cable'), get_muscle_id('Abs'), 'isolation', 'pull', 'kneeling', 2, true),
('Cable Woodchopper', get_category_id('Core'), get_equipment_id('Cable'), get_muscle_id('Obliques'), 'compound', 'rotation', 'standing', 2, true),
('Cable Russian Twist', get_category_id('Core'), get_equipment_id('Cable'), get_muscle_id('Obliques'), 'isolation', 'rotation', 'seated', 2, true),
('Cable Pallof Press', get_category_id('Core'), get_equipment_id('Cable'), get_muscle_id('Obliques'), 'isometric', 'static', 'standing', 2, true),
('Cable Side Bend', get_category_id('Core'), get_equipment_id('Cable'), get_muscle_id('Obliques'), 'isolation', 'pull', 'standing', 1, true);

-- Bodyweight Core Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, is_bodyweight, difficulty_level, is_public) VALUES
('Plank', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'isometric', 'static', 'lying_flat', true, 1, true),
('Side Plank', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Obliques'), 'isometric', 'static', 'lying_flat', true, 2, true),
('Crunch', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'isolation', 'pull', 'lying_flat', true, 1, true),
('Bicycle Crunch', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Obliques'), 'compound', 'rotation', 'lying_flat', true, 2, true),
('Russian Twist', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Obliques'), 'isolation', 'rotation', 'seated', true, 1, true),
('Leg Raise', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'isolation', 'pull', 'lying_flat', true, 2, true),
('Hanging Leg Raise', get_category_id('Core'), get_equipment_id('Pull-up Bar'), get_muscle_id('Abs'), 'isolation', 'pull', 'hanging', true, 3, true),
('Hanging Knee Raise', get_category_id('Core'), get_equipment_id('Pull-up Bar'), get_muscle_id('Abs'), 'isolation', 'pull', 'hanging', true, 2, true),
('Mountain Climbers', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'compound', 'dynamic', 'lying_flat', true, 2, true),
('Flutter Kicks', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'isolation', 'dynamic', 'lying_flat', true, 1, true),
('Scissor Kicks', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'isolation', 'dynamic', 'lying_flat', true, 1, true),
('V-Ups', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'compound', 'pull', 'lying_flat', true, 3, true),
('Superman', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Lower Back'), 'isolation', 'push', 'lying_flat', true, 1, true),
('Bird Dog', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Lower Back'), 'isolation', 'static', 'kneeling', true, 1, true),
('Dead Bug', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'isolation', 'dynamic', 'lying_flat', true, 2, true),
('Hollow Body Hold', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'isometric', 'static', 'lying_flat', true, 2, true),
('L-Sit', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'isometric', 'static', 'seated', true, 4, true),
('Dragon Flag', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Abs'), 'compound', 'pull', 'lying_flat', true, 5, true),
('Human Flag', get_category_id('Core'), get_equipment_id('Bodyweight'), get_muscle_id('Obliques'), 'isometric', 'static', 'standing', true, 5, true),
('Ab Wheel Rollout', get_category_id('Core'), get_equipment_id('Ab Wheel'), get_muscle_id('Abs'), 'compound', 'pull', 'kneeling', 3, true),
('Standing Ab Wheel Rollout', get_category_id('Core'), get_equipment_id('Ab Wheel'), get_muscle_id('Abs'), 'compound', 'pull', 'standing', 5, true);

-- Machine Core Exercises
INSERT INTO exercises (name, category_id, equipment_id, primary_muscle_id, movement_type, force_type, body_position, difficulty_level, is_public) VALUES
('Machine Crunch', get_category_id('Core'), get_equipment_id('Cable Machine'), get_muscle_id('Abs'), 'isolation', 'pull', 'seated', 1, true),
('Torso Rotation Machine', get_category_id('Core'), get_equipment_id('Cable Machine'), get_muscle_id('Obliques'), 'isolation', 'rotation', 'seated', 1, true),
('Captain Chair Leg Raise', get_category_id('Core'), get_equipment_id('Dip Bars'), get_muscle_id('Abs'), 'isolation', 'pull', 'hanging', 2, true),
('Back Extension Machine', get_category_id('Core'), get_equipment_id('Cable Machine'), get_muscle_id('Lower Back'), 'isolation', 'push', 'lying_flat', 1, true),
('Roman Chair Back Extension', get_category_id('Core'), get_equipment_id('Cable Machine'), get_muscle_id('Lower Back'), 'isolation', 'push', 'lying_decline', 2, true),
('Reverse Hyper Machine', get_category_id('Core'), get_equipment_id('Cable Machine'), get_muscle_id('Lower Back'), 'isolation', 'push', 'lying_flat', 2, true);