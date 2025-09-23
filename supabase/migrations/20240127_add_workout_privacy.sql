-- Add is_public field to base workouts table
ALTER TABLE workouts
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_workouts_public ON workouts(is_public);
CREATE INDEX IF NOT EXISTS idx_workouts_created_by ON workouts(created_by);

-- Update existing workouts to be public by default
UPDATE workouts SET is_public = true WHERE is_public IS NULL;

-- Add is_favorite field to favorite_workouts if not exists
ALTER TABLE favorite_workouts
ADD COLUMN IF NOT EXISTS added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a view for user-accessible workouts (their own + public + favorited)
CREATE OR REPLACE VIEW user_accessible_workouts AS
SELECT DISTINCT
  w.*,
  fw.id IS NOT NULL AS is_favorited,
  CASE
    WHEN w.created_by = auth.uid() THEN 'owned'
    WHEN fw.id IS NOT NULL THEN 'favorited'
    WHEN w.is_public = true THEN 'public'
    ELSE 'restricted'
  END AS access_type
FROM workouts w
LEFT JOIN favorite_workouts fw ON w.id = fw.workout_id AND fw.user_id = auth.uid()
WHERE
  w.created_by = auth.uid() -- User's own workouts
  OR w.is_public = true -- Public workouts
  OR fw.id IS NOT NULL; -- User's favorited workouts

-- Create RLS policies for workouts table
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own workouts, public workouts, and favorited workouts
CREATE POLICY "Users can view accessible workouts" ON workouts
FOR SELECT USING (
  created_by = auth.uid()
  OR is_public = true
  OR EXISTS (
    SELECT 1 FROM favorite_workouts
    WHERE workout_id = workouts.id
    AND user_id = auth.uid()
  )
);

-- Policy: Users can create their own workouts
CREATE POLICY "Users can create own workouts" ON workouts
FOR INSERT WITH CHECK (created_by = auth.uid());

-- Policy: Users can update their own workouts
CREATE POLICY "Users can update own workouts" ON workouts
FOR UPDATE USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Policy: Users can delete their own workouts
CREATE POLICY "Users can delete own workouts" ON workouts
FOR DELETE USING (created_by = auth.uid());

-- RLS policies for favorite_workouts table
ALTER TABLE favorite_workouts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own favorites
CREATE POLICY "Users can view own favorites" ON favorite_workouts
FOR SELECT USING (user_id = auth.uid());

-- Policy: Users can add favorites
CREATE POLICY "Users can add favorites" ON favorite_workouts
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy: Users can remove favorites
CREATE POLICY "Users can delete favorites" ON favorite_workouts
FOR DELETE USING (user_id = auth.uid());

-- Add comments
COMMENT ON COLUMN workouts.is_public IS 'Whether this workout is visible to all users';
COMMENT ON COLUMN workouts.created_by IS 'User who created this workout';
COMMENT ON VIEW user_accessible_workouts IS 'View of all workouts a user can access (owned, public, or favorited)';