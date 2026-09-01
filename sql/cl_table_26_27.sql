-- Champions League Table 2026/27 SQL Table
-- Mirrors cl_table_25_26 — one table per season, updated via admin bulk-update.

CREATE TABLE IF NOT EXISTS cl_table_26_27 (
  id SERIAL PRIMARY KEY,
  rank INTEGER NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  member_number INTEGER,
  points INTEGER NOT NULL DEFAULT 0,
  last_md_points INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  is_loser BOOLEAN DEFAULT FALSE,
  is_tie BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient ranking queries
CREATE INDEX IF NOT EXISTS idx_cl_table_26_27_rank ON cl_table_26_27(rank);
CREATE INDEX IF NOT EXISTS idx_cl_table_26_27_points ON cl_table_26_27(points DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE cl_table_26_27 ENABLE ROW LEVEL SECURITY;

-- Public read access (writes go through the service role key, which bypasses RLS)
CREATE POLICY "Enable read access for all users" ON cl_table_26_27
    FOR SELECT USING (true);
