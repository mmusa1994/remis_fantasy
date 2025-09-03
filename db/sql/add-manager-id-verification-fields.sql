-- Add manager ID verification fields to users table
-- This migration adds fields to track manager ID verification status

-- Add verification fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id_verified BOOLEAN DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id_verification_note TEXT DEFAULT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_manager_id_verified ON users(manager_id_verified);

-- Update existing records to mark them as verified (backwards compatibility)
-- Only update records that have a manager_id but no verification status
UPDATE users 
SET manager_id_verified = true 
WHERE manager_id IS NOT NULL 
  AND manager_id_verified IS NULL;

-- Add comment to document the changes
COMMENT ON COLUMN users.manager_id_verified IS 'Indicates if the manager ID has been verified with FPL API';
COMMENT ON COLUMN users.manager_id_verification_note IS 'Stores any warning or error message from verification attempt';