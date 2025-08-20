-- Fix Supabase Table Editor constraint issue
-- Two solutions: set default value OR remove constraint completely

-- SOLUTION 1: Set default value for league_type column
-- This will auto-fill 'standard' when adding new rows in Supabase Editor
ALTER TABLE premier_league_25_26 
ALTER COLUMN league_type SET DEFAULT 'standard';

-- SOLUTION 2: Completely remove the constraint (more flexible for manual editing)
-- Uncomment the line below if you prefer no constraints
-- ALTER TABLE premier_league_25_26 DROP CONSTRAINT IF EXISTS premier_league_25_26_league_type_check;

-- SOLUTION 3: Make the constraint less restrictive by allowing empty strings
-- Replace existing constraint to also allow empty strings
ALTER TABLE premier_league_25_26 
DROP CONSTRAINT IF EXISTS premier_league_25_26_league_type_check;

ALTER TABLE premier_league_25_26 
ADD CONSTRAINT premier_league_25_26_league_type_check 
CHECK (
  league_type IS NULL 
  OR league_type = '' 
  OR league_type IN ('premium', 'standard', 'h2h', 'free')
);

-- Verify the changes
SELECT column_name, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'premier_league_25_26' 
AND column_name = 'league_type';

SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'premier_league_25_26'::regclass 
AND contype = 'c'
AND conname LIKE '%league_type%';
