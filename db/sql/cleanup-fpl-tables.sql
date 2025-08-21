-- FPL Database Cleanup Script
-- This script removes all unnecessary tables, keeping only fpl_players, fpl_teams, and fpl_settings
-- Run this in your Supabase SQL Editor

-- Drop all unnecessary tables in correct order (respecting foreign key constraints)

-- 1. Drop manager-related tables first
DROP TABLE IF EXISTS public.fpl_manager_metrics CASCADE;
DROP TABLE IF EXISTS public.fpl_manager_picks CASCADE;

-- 2. Drop events and streaming tables
DROP TABLE IF EXISTS public.fpl_events_stream CASCADE;

-- 3. Drop gameweek status table
DROP TABLE IF EXISTS public.fpl_gameweek_status CASCADE;

-- 4. Drop fixture-related tables
DROP TABLE IF EXISTS public.fpl_fixture_stats CASCADE;
DROP TABLE IF EXISTS public.fpl_fixtures CASCADE;

-- 5. Drop live player stats table
DROP TABLE IF EXISTS public.fpl_live_players CASCADE;

-- 6. Drop element types table (after all references are removed)
DROP TABLE IF EXISTS public.fpl_element_types CASCADE;

-- Remove any orphaned indexes that might remain
DROP INDEX IF EXISTS idx_fpl_fixtures_gw;
DROP INDEX IF EXISTS idx_fpl_fixtures_started;
DROP INDEX IF EXISTS idx_fpl_live_players_gw;
DROP INDEX IF EXISTS idx_fpl_events_stream_gw;
DROP INDEX IF EXISTS idx_fpl_events_stream_unprocessed;
DROP INDEX IF EXISTS idx_fpl_manager_metrics_gw;
DROP INDEX IF EXISTS idx_fpl_manager_picks_gw_manager;

-- Update fpl_players table to remove foreign key constraint to element_types
ALTER TABLE public.fpl_players DROP CONSTRAINT IF EXISTS fpl_players_element_type_fkey;

-- Keep only essential tables:
-- - public.fpl_settings (for basic configuration)
-- - public.fpl_players (for player data, updated periodically)
-- - public.fpl_teams (for team data, updated periodically)

-- Final confirmation query
SELECT 'FPL database cleanup complete! Remaining tables:' as status;
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fpl_%' 
ORDER BY tablename;
