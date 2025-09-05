-- Add onboarding_shown field to users table
-- This field tracks whether the user has seen the onboarding modal

-- Add the column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_shown BOOLEAN DEFAULT FALSE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_onboarding_shown ON users(onboarding_shown);

-- Comment on the column
COMMENT ON COLUMN users.onboarding_shown IS 'Tracks if user has completed the onboarding flow';

-- Update existing users to show onboarding for those without manager_id
-- (Assuming users without manager_id haven't been properly onboarded)
UPDATE users 
SET onboarding_shown = FALSE 
WHERE onboarding_shown IS NULL 
  AND (manager_id IS NULL OR manager_id = '');

-- Users with manager_id already set can skip onboarding
UPDATE users 
SET onboarding_shown = TRUE 
WHERE onboarding_shown IS NULL 
  AND manager_id IS NOT NULL 
  AND manager_id != '';