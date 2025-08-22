-- Update fpl_teams table to match simplified structure
-- Run this after running cleanup-fpl-tables.sql

-- Remove unnecessary columns from fpl_teams table
ALTER TABLE public.fpl_teams 
DROP COLUMN IF EXISTS draw,
DROP COLUMN IF EXISTS form,
DROP COLUMN IF EXISTS loss,
DROP COLUMN IF EXISTS played,
DROP COLUMN IF EXISTS points,
DROP COLUMN IF EXISTS position,
DROP COLUMN IF EXISTS strength,
DROP COLUMN IF EXISTS team_division,
DROP COLUMN IF EXISTS unavailable,
DROP COLUMN IF EXISTS win,
DROP COLUMN IF EXISTS strength_overall_home,
DROP COLUMN IF EXISTS strength_overall_away,
DROP COLUMN IF EXISTS strength_attack_home,
DROP COLUMN IF EXISTS strength_attack_away,
DROP COLUMN IF EXISTS strength_defence_home,
DROP COLUMN IF EXISTS strength_defence_away,
DROP COLUMN IF EXISTS pulse_id;

-- Keep only essential columns: id, name, short_name, code
-- These will be used for displaying team names and basic info

-- Verify the final structure
SELECT 'Updated fpl_teams table structure:' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'fpl_teams' 
ORDER BY ordinal_position;
