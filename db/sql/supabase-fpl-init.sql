-- FPL Live Database Initialization Script
-- Run this in your Supabase SQL Editor

-- 1. Settings table
CREATE TABLE IF NOT EXISTS public.fpl_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpl_proxy_url TEXT,
    cron_secret TEXT,
    default_gw INTEGER DEFAULT 1,
    default_manager_id INTEGER DEFAULT 133790,
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Teams table (must be created before players due to FK)
CREATE TABLE IF NOT EXISTS public.fpl_teams (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    code INTEGER,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Element types (positions)
CREATE TABLE IF NOT EXISTS public.fpl_element_types (
    id INTEGER PRIMARY KEY,
    plural_name TEXT NOT NULL,
    plural_name_short TEXT NOT NULL,
    singular_name TEXT NOT NULL,
    singular_name_short TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Players table
CREATE TABLE IF NOT EXISTS public.fpl_players (
    id INTEGER PRIMARY KEY,
    web_name TEXT NOT NULL,
    first_name TEXT NOT NULL,
    second_name TEXT NOT NULL,
    team INTEGER NOT NULL REFERENCES public.fpl_teams(id),
    element_type INTEGER NOT NULL REFERENCES public.fpl_element_types(id),
    total_points INTEGER DEFAULT 0,
    now_cost INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Fixtures table
CREATE TABLE IF NOT EXISTS public.fpl_fixtures (
    id INTEGER PRIMARY KEY,
    gw INTEGER NOT NULL,
    team_h INTEGER NOT NULL REFERENCES public.fpl_teams(id),
    team_a INTEGER NOT NULL REFERENCES public.fpl_teams(id),
    team_h_score INTEGER,
    team_a_score INTEGER,
    started BOOLEAN DEFAULT false,
    finished BOOLEAN DEFAULT false,
    minutes INTEGER DEFAULT 0,
    kickoff_time TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Fixture stats
CREATE TABLE IF NOT EXISTS public.fpl_fixture_stats (
    fixture_id INTEGER REFERENCES public.fpl_fixtures(id),
    identifier TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('H', 'A')),
    player_id INTEGER NOT NULL REFERENCES public.fpl_players(id),
    value INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (fixture_id, identifier, side, player_id)
);

-- 7. Live player stats
CREATE TABLE IF NOT EXISTS public.fpl_live_players (
    gw INTEGER NOT NULL,
    player_id INTEGER NOT NULL REFERENCES public.fpl_players(id),
    minutes INTEGER DEFAULT 0,
    goals_scored INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    goals_conceded INTEGER DEFAULT 0,
    own_goals INTEGER DEFAULT 0,
    penalties_saved INTEGER DEFAULT 0,
    penalties_missed INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    bonus INTEGER DEFAULT 0,
    bps INTEGER DEFAULT 0,
    influence NUMERIC DEFAULT 0,
    creativity NUMERIC DEFAULT 0,
    threat NUMERIC DEFAULT 0,
    ict_index NUMERIC DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    in_dreamteam BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (gw, player_id)
);

-- 8. Events stream
CREATE TABLE IF NOT EXISTS public.fpl_events_stream (
    id BIGSERIAL PRIMARY KEY,
    gw INTEGER NOT NULL,
    fixture_id INTEGER REFERENCES public.fpl_fixtures(id),
    event_type TEXT NOT NULL,
    player_id INTEGER REFERENCES public.fpl_players(id),
    delta_value INTEGER DEFAULT 0,
    side TEXT CHECK (side IN ('H', 'A')),
    occurred_at TIMESTAMPTZ DEFAULT now(),
    processed BOOLEAN DEFAULT false
);

-- 9. Manager picks
CREATE TABLE IF NOT EXISTS public.fpl_manager_picks (
    gw INTEGER NOT NULL,
    manager_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL REFERENCES public.fpl_players(id),
    position INTEGER NOT NULL,
    multiplier INTEGER DEFAULT 1,
    is_captain BOOLEAN DEFAULT false,
    is_vice_captain BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (gw, manager_id, player_id)
);

-- 10. Manager metrics
CREATE TABLE IF NOT EXISTS public.fpl_manager_metrics (
    gw INTEGER NOT NULL,
    manager_id INTEGER NOT NULL,
    team_points_no_bonus INTEGER DEFAULT 0,
    team_points_final INTEGER DEFAULT 0,
    captain_id INTEGER REFERENCES public.fpl_players(id),
    captain_points INTEGER DEFAULT 0,
    vice_captain_id INTEGER REFERENCES public.fpl_players(id),
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    clean_sheets INTEGER DEFAULT 0,
    cards_yellow INTEGER DEFAULT 0,
    cards_red INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    predicted_bonus INTEGER DEFAULT 0,
    final_bonus INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (gw, manager_id)
);

-- 11. Gameweek status
CREATE TABLE IF NOT EXISTS public.fpl_gameweek_status (
    gw INTEGER PRIMARY KEY,
    bonus_added BOOLEAN DEFAULT false,
    data_checked BOOLEAN DEFAULT false,
    finished BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fpl_fixtures_gw ON public.fpl_fixtures(gw);
CREATE INDEX IF NOT EXISTS idx_fpl_fixtures_started ON public.fpl_fixtures(started) WHERE started = true;
CREATE INDEX IF NOT EXISTS idx_fpl_live_players_gw ON public.fpl_live_players(gw);
CREATE INDEX IF NOT EXISTS idx_fpl_events_stream_gw ON public.fpl_events_stream(gw);
CREATE INDEX IF NOT EXISTS idx_fpl_events_stream_unprocessed ON public.fpl_events_stream(processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_fpl_manager_metrics_gw ON public.fpl_manager_metrics(gw);
CREATE INDEX IF NOT EXISTS idx_fpl_manager_picks_gw_manager ON public.fpl_manager_picks(gw, manager_id);

-- Insert default settings
INSERT INTO public.fpl_settings (fpl_proxy_url, default_gw, default_manager_id) 
VALUES (null, 1, 133790) 
ON CONFLICT (id) DO NOTHING;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers to all tables
DROP TRIGGER IF EXISTS update_fpl_settings_updated_at ON public.fpl_settings;
CREATE TRIGGER update_fpl_settings_updated_at BEFORE UPDATE ON public.fpl_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_players_updated_at ON public.fpl_players;
CREATE TRIGGER update_fpl_players_updated_at BEFORE UPDATE ON public.fpl_players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_teams_updated_at ON public.fpl_teams;
CREATE TRIGGER update_fpl_teams_updated_at BEFORE UPDATE ON public.fpl_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_element_types_updated_at ON public.fpl_element_types;
CREATE TRIGGER update_fpl_element_types_updated_at BEFORE UPDATE ON public.fpl_element_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_fixtures_updated_at ON public.fpl_fixtures;
CREATE TRIGGER update_fpl_fixtures_updated_at BEFORE UPDATE ON public.fpl_fixtures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_fixture_stats_updated_at ON public.fpl_fixture_stats;
CREATE TRIGGER update_fpl_fixture_stats_updated_at BEFORE UPDATE ON public.fpl_fixture_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_live_players_updated_at ON public.fpl_live_players;
CREATE TRIGGER update_fpl_live_players_updated_at BEFORE UPDATE ON public.fpl_live_players FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_manager_metrics_updated_at ON public.fpl_manager_metrics;
CREATE TRIGGER update_fpl_manager_metrics_updated_at BEFORE UPDATE ON public.fpl_manager_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_manager_picks_updated_at ON public.fpl_manager_picks;
CREATE TRIGGER update_fpl_manager_picks_updated_at BEFORE UPDATE ON public.fpl_manager_picks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fpl_gameweek_status_updated_at ON public.fpl_gameweek_status;
CREATE TRIGGER update_fpl_gameweek_status_updated_at BEFORE UPDATE ON public.fpl_gameweek_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE public.fpl_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_element_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_fixtures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_fixture_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_live_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_events_stream ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_manager_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_manager_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_gameweek_status ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
DROP POLICY IF EXISTS "Allow public read on fpl_settings" ON public.fpl_settings;
CREATE POLICY "Allow public read on fpl_settings" ON public.fpl_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_players" ON public.fpl_players;
CREATE POLICY "Allow public read on fpl_players" ON public.fpl_players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_teams" ON public.fpl_teams;
CREATE POLICY "Allow public read on fpl_teams" ON public.fpl_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_element_types" ON public.fpl_element_types;
CREATE POLICY "Allow public read on fpl_element_types" ON public.fpl_element_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_fixtures" ON public.fpl_fixtures;
CREATE POLICY "Allow public read on fpl_fixtures" ON public.fpl_fixtures FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_fixture_stats" ON public.fpl_fixture_stats;
CREATE POLICY "Allow public read on fpl_fixture_stats" ON public.fpl_fixture_stats FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_live_players" ON public.fpl_live_players;
CREATE POLICY "Allow public read on fpl_live_players" ON public.fpl_live_players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_events_stream" ON public.fpl_events_stream;
CREATE POLICY "Allow public read on fpl_events_stream" ON public.fpl_events_stream FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_manager_metrics" ON public.fpl_manager_metrics;
CREATE POLICY "Allow public read on fpl_manager_metrics" ON public.fpl_manager_metrics FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_manager_picks" ON public.fpl_manager_picks;
CREATE POLICY "Allow public read on fpl_manager_picks" ON public.fpl_manager_picks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read on fpl_gameweek_status" ON public.fpl_gameweek_status;
CREATE POLICY "Allow public read on fpl_gameweek_status" ON public.fpl_gameweek_status FOR SELECT USING (true);

-- Create service role policies for full access
DROP POLICY IF EXISTS "Service role full access on fpl_settings" ON public.fpl_settings;
CREATE POLICY "Service role full access on fpl_settings" ON public.fpl_settings USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_players" ON public.fpl_players;
CREATE POLICY "Service role full access on fpl_players" ON public.fpl_players USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_teams" ON public.fpl_teams;
CREATE POLICY "Service role full access on fpl_teams" ON public.fpl_teams USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_element_types" ON public.fpl_element_types;
CREATE POLICY "Service role full access on fpl_element_types" ON public.fpl_element_types USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_fixtures" ON public.fpl_fixtures;
CREATE POLICY "Service role full access on fpl_fixtures" ON public.fpl_fixtures USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_fixture_stats" ON public.fpl_fixture_stats;
CREATE POLICY "Service role full access on fpl_fixture_stats" ON public.fpl_fixture_stats USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_live_players" ON public.fpl_live_players;
CREATE POLICY "Service role full access on fpl_live_players" ON public.fpl_live_players USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_events_stream" ON public.fpl_events_stream;
CREATE POLICY "Service role full access on fpl_events_stream" ON public.fpl_events_stream USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_manager_metrics" ON public.fpl_manager_metrics;
CREATE POLICY "Service role full access on fpl_manager_metrics" ON public.fpl_manager_metrics USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_manager_picks" ON public.fpl_manager_picks;
CREATE POLICY "Service role full access on fpl_manager_picks" ON public.fpl_manager_picks USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Service role full access on fpl_gameweek_status" ON public.fpl_gameweek_status;
CREATE POLICY "Service role full access on fpl_gameweek_status" ON public.fpl_gameweek_status USING (auth.jwt() ->> 'role' = 'service_role');

-- Final confirmation query
SELECT 'FPL Live database initialization complete!' as status;
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'fpl_%' 
ORDER BY tablename;