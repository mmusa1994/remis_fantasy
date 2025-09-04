-- Add ai_team_analyzing column to users table
-- This tracks when user last used the AI Team Guru feature (weekly limit)

ALTER TABLE users 
ADD COLUMN ai_team_analyzing timestamptz;

-- Add index for performance when checking usage limits
CREATE INDEX idx_users_ai_team_analyzing ON users(ai_team_analyzing);

-- Add comment to document the column purpose
COMMENT ON COLUMN users.ai_team_analyzing IS 'Timestamp of last AI Team Guru usage (weekly limit tracking)';