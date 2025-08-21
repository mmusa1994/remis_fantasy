-- Add missing columns to fpl_teams table
ALTER TABLE public.fpl_teams 
ADD COLUMN IF NOT EXISTS draw INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS form TEXT,
ADD COLUMN IF NOT EXISTS loss INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS position INTEGER,
ADD COLUMN IF NOT EXISTS strength INTEGER,
ADD COLUMN IF NOT EXISTS team_division INTEGER,
ADD COLUMN IF NOT EXISTS unavailable BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS win INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS strength_overall_home INTEGER,
ADD COLUMN IF NOT EXISTS strength_overall_away INTEGER,
ADD COLUMN IF NOT EXISTS strength_attack_home INTEGER,
ADD COLUMN IF NOT EXISTS strength_attack_away INTEGER,
ADD COLUMN IF NOT EXISTS strength_defence_home INTEGER,
ADD COLUMN IF NOT EXISTS strength_defence_away INTEGER,
ADD COLUMN IF NOT EXISTS pulse_id INTEGER;

-- Verify the update
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fpl_teams' 
  AND table_schema = 'public'
ORDER BY ordinal_position;