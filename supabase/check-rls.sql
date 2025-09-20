-- Check if RLS is enabled on all tables
SELECT tablename,
       CASE
         WHEN rowsecurity = true THEN '✅ Enabled'
         ELSE '❌ Disabled - SECURITY RISK!'
       END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- If any tables show as disabled, enable RLS with:
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_workouts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.workout_completions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.exercise_completions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;