-- Test script to verify the memory enhancement migration
-- Run this after applying the migration to ensure everything works

-- Test 1: Verify tables exist
SELECT 'Testing table creation...' AS test;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('user_memory_facts', 'conversation_summaries', 'user_preference_profiles');

-- Test 2: Verify the enhanced function exists
SELECT 'Testing enhanced function...' AS test;
SELECT routine_name, data_type
FROM information_schema.routines
WHERE routine_name = 'get_enhanced_rag_context'
  AND routine_schema = 'public';

-- Test 3: Verify original function still exists and works
SELECT 'Testing original function compatibility...' AS test;
SELECT routine_name, data_type
FROM information_schema.routines
WHERE routine_name = 'get_rag_context_for_user'
  AND routine_schema = 'public';

-- Test 4: Test inserting sample data (replace with real user_id)
-- Note: You'll need a valid user_id from auth.users for this to work
/*
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  -- Get a test user ID (you may need to adjust this)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;

  IF test_user_id IS NOT NULL THEN
    -- Insert test memory fact
    INSERT INTO user_memory_facts (user_id, fact_type, content, confidence)
    VALUES (test_user_id, 'preference', 'Prefers morning workouts', 0.9);

    -- Insert test preference profile
    INSERT INTO user_preference_profiles (user_id, workout_preferences)
    VALUES (test_user_id, '{"preferredTime": "morning"}')
    ON CONFLICT (user_id) DO UPDATE
    SET workout_preferences = EXCLUDED.workout_preferences;

    RAISE NOTICE 'Test data inserted successfully for user %', test_user_id;
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
END $$;
*/

-- Test 5: Test calling the enhanced function (uncomment and add valid user_id)
/*
SELECT * FROM get_enhanced_rag_context('your-user-id-here'::UUID);
*/

-- Test 6: Verify indexes
SELECT 'Testing indexes...' AS test;
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_memory_facts', 'conversation_summaries', 'user_preference_profiles');

-- Test 7: Verify RLS policies
SELECT 'Testing RLS policies...' AS test;
SELECT tablename, policyname, cmd, permissive
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('user_memory_facts', 'conversation_summaries', 'user_preference_profiles');

-- Summary
SELECT 'Migration test complete!' AS result;