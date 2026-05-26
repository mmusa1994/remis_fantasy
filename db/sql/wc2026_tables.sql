-- WC2026 Fantasy Tables
-- Run this migration in Supabase SQL Editor

-- 1. Fantasy League Standings (same structure as cl_table_25_26)
CREATE TABLE IF NOT EXISTS wc2026_fantasy_table (
  id BIGSERIAL PRIMARY KEY,
  rank INTEGER NOT NULL,
  team_name TEXT NOT NULL,
  user_name TEXT NOT NULL,
  avatar_url TEXT DEFAULT '',
  member_number INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  last_md_points INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  is_loser BOOLEAN DEFAULT FALSE,
  is_tie BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc2026_fantasy_rank ON wc2026_fantasy_table(rank);

-- 2. Match Schedule & Results
CREATE TABLE IF NOT EXISTS wc2026_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  phase TEXT NOT NULL CHECK (phase IN ('group_stage', 'round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'third_place', 'final')),
  group_name TEXT CHECK (group_name IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L') OR group_name IS NULL),
  venue TEXT,
  home_score INTEGER,
  away_score INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc2026_matches_phase ON wc2026_matches(phase);
CREATE INDEX IF NOT EXISTS idx_wc2026_matches_group ON wc2026_matches(group_name);
CREATE INDEX IF NOT EXISTS idx_wc2026_matches_date ON wc2026_matches(match_date);
CREATE INDEX IF NOT EXISTS idx_wc2026_matches_status ON wc2026_matches(status);

-- 3. Group Stage Standings
CREATE TABLE IF NOT EXISTS wc2026_group_standings (
  id BIGSERIAL PRIMARY KEY,
  group_name TEXT NOT NULL CHECK (group_name IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L')),
  team_name TEXT NOT NULL,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wc2026_groups_name ON wc2026_group_standings(group_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_wc2026_groups_team ON wc2026_group_standings(group_name, team_name);

-- 4. WC2026 Fantasy Registrations
CREATE TABLE IF NOT EXISTS wc2026_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  team_name TEXT,
  payment_method TEXT CHECK (payment_method IN ('bank', 'wise', 'cash', 'paypal')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
  payment_proof_url TEXT,
  notes TEXT,
  admin_notes TEXT,
  codes_email_sent BOOLEAN DEFAULT FALSE,
  codes_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wc2026_reg_email ON wc2026_registrations(email);

-- Enable RLS (Row Level Security) - adjust policies as needed
ALTER TABLE wc2026_fantasy_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc2026_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc2026_group_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wc2026_registrations ENABLE ROW LEVEL SECURITY;

-- Service role policies (for API access via SUPABASE_SERVICE_ROLE_KEY)
CREATE POLICY "Service role full access" ON wc2026_fantasy_table FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wc2026_matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wc2026_group_standings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON wc2026_registrations FOR ALL USING (true) WITH CHECK (true);

-- Public read access for standings and matches
CREATE POLICY "Public read fantasy table" ON wc2026_fantasy_table FOR SELECT USING (true);
CREATE POLICY "Public read matches" ON wc2026_matches FOR SELECT USING (true);
CREATE POLICY "Public read groups" ON wc2026_group_standings FOR SELECT USING (true);
