-- Create the ai_usage_limits table for tracking AI rate limiting
CREATE TABLE IF NOT EXISTS ai_usage_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  count INTEGER NOT NULL DEFAULT 0,
  week_start BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_usage_limits_user_id ON ai_usage_limits(user_id);

-- Create index on week_start for cleanup operations
CREATE INDEX IF NOT EXISTS idx_ai_usage_limits_week_start ON ai_usage_limits(week_start);

-- DISABLE Row Level Security for easier access
ALTER TABLE ai_usage_limits DISABLE ROW LEVEL SECURITY;

-- Optional: Add function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_ai_usage_limits_updated_at ON ai_usage_limits;
CREATE TRIGGER update_ai_usage_limits_updated_at
    BEFORE UPDATE ON ai_usage_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();