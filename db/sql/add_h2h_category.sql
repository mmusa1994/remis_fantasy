-- Add h2h_category column to registration_25_26 table
-- This will replace the boolean h2h_league field with more granular categorization

ALTER TABLE registration_25_26 
ADD COLUMN IF NOT EXISTS h2h_category VARCHAR(20) DEFAULT NULL;

-- Add comment to the column for documentation
COMMENT ON COLUMN registration_25_26.h2h_category IS 'H2H category: null (no H2H), h2h (H2H Liga), h2h2 (H2H2 Liga)';

-- Create index for faster queries when filtering by h2h_category
CREATE INDEX IF NOT EXISTS idx_registration_h2h_category ON registration_25_26(h2h_category);

-- Add check constraint to ensure valid values
ALTER TABLE registration_25_26 
ADD CONSTRAINT h2h_category_valid CHECK (h2h_category IS NULL OR h2h_category IN ('h2h', 'h2h2'));

-- Optional: Migrate existing data if h2h_league column exists
-- This assumes existing h2h_league=true players should be categorized as 'h2h'
-- You can run this later after deciding the migration strategy
/*
UPDATE registration_25_26 
SET h2h_category = 'h2h' 
WHERE h2h_league = true AND league_type = 'premium';

UPDATE registration_25_26 
SET h2h_category = 'h2h2' 
WHERE h2h_league = true AND league_type = 'standard';
*/