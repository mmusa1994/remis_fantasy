-- Add points column to registration_25_26 table
-- This column will store the fantasy points for each player

ALTER TABLE registration_25_26 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;

-- Add comment to the column for documentation
COMMENT ON COLUMN registration_25_26.points IS 'Fantasy points accumulated by the player in Premier League competition';

-- Create index for faster queries when sorting by points
CREATE INDEX IF NOT EXISTS idx_registration_points ON registration_25_26(points DESC);

-- Optional: Add constraints
-- ALTER TABLE registration_25_26 
-- ADD CONSTRAINT points_non_negative CHECK (points >= 0);

-- Update existing records to have 0 points if NULL
UPDATE registration_25_26 
SET points = 0 
WHERE points IS NULL;