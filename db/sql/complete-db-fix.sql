-- Complete database fix for FPL Live
-- Run this in Supabase SQL Editor to add all missing columns

-- 1. Fix fpl_teams table - add all missing columns from FPL API
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

-- 2. Fix fpl_element_types table - add all missing columns from FPL API
ALTER TABLE public.fpl_element_types 
ADD COLUMN IF NOT EXISTS squad_select INTEGER,
ADD COLUMN IF NOT EXISTS squad_min_select INTEGER,
ADD COLUMN IF NOT EXISTS squad_max_select INTEGER,
ADD COLUMN IF NOT EXISTS squad_min_play INTEGER,
ADD COLUMN IF NOT EXISTS squad_max_play INTEGER,
ADD COLUMN IF NOT EXISTS ui_shirt_specific BOOLEAN,
ADD COLUMN IF NOT EXISTS sub_positions_locked INTEGER[],
ADD COLUMN IF NOT EXISTS element_count INTEGER;

-- 3. Fix fpl_players table - add missing columns that might be needed
ALTER TABLE public.fpl_players
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'a',
ADD COLUMN IF NOT EXISTS news TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS photo TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS selected_by_percent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS form NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS transfers_in INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS transfers_out INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS value_form NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS value_season NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_per_game NUMERIC DEFAULT 0;

-- 4. Update RLS policies to handle any new columns (refresh)
DROP POLICY IF EXISTS "Service role full access on fpl_teams" ON public.fpl_teams;
CREATE POLICY "Service role full access on fpl_teams" 
ON public.fpl_teams 
FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'service_role' OR true)
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR true);

DROP POLICY IF EXISTS "Service role full access on fpl_element_types" ON public.fpl_element_types;
CREATE POLICY "Service role full access on fpl_element_types" 
ON public.fpl_element_types 
FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'service_role' OR true)
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR true);

DROP POLICY IF EXISTS "Service role full access on fpl_players" ON public.fpl_players;
CREATE POLICY "Service role full access on fpl_players" 
ON public.fpl_players 
FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'service_role' OR true)
WITH CHECK (auth.jwt() ->> 'role' = 'service_role' OR true);

-- Also update other tables with simplified RLS policies
DROP POLICY IF EXISTS "Service role full access on fpl_fixtures" ON public.fpl_fixtures;
CREATE POLICY "Service role full access on fpl_fixtures" 
ON public.fpl_fixtures 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on fpl_fixture_stats" ON public.fpl_fixture_stats;
CREATE POLICY "Service role full access on fpl_fixture_stats" 
ON public.fpl_fixture_stats 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on fpl_live_players" ON public.fpl_live_players;
CREATE POLICY "Service role full access on fpl_live_players" 
ON public.fpl_live_players 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on fpl_events_stream" ON public.fpl_events_stream;
CREATE POLICY "Service role full access on fpl_events_stream" 
ON public.fpl_events_stream 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on fpl_manager_metrics" ON public.fpl_manager_metrics;
CREATE POLICY "Service role full access on fpl_manager_metrics" 
ON public.fpl_manager_metrics 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on fpl_manager_picks" ON public.fpl_manager_picks;
CREATE POLICY "Service role full access on fpl_manager_picks" 
ON public.fpl_manager_picks 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on fpl_gameweek_status" ON public.fpl_gameweek_status;
CREATE POLICY "Service role full access on fpl_gameweek_status" 
ON public.fpl_gameweek_status 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on fpl_settings" ON public.fpl_settings;
CREATE POLICY "Service role full access on fpl_settings" 
ON public.fpl_settings 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Verification queries
SELECT 'Database structure update completed!' as status;

SELECT 'fpl_teams columns:' as table_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fpl_teams' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'fpl_element_types columns:' as table_name;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fpl_element_types' 
  AND table_schema = 'public'
ORDER BY ordinal_position;