-- Add device_name column to activities table
ALTER TABLE activities ADD COLUMN IF NOT EXISTS device_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN activities.device_name IS 'Name of the device used to record the activity';