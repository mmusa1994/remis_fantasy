-- Champions League Table 2025/26 SQL Table
-- This table stores Champions League fantasy league data

CREATE TABLE IF NOT EXISTS cl_table_25_26 (
  id SERIAL PRIMARY KEY,
  rank INTEGER NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255),
  member_number INTEGER,
  points INTEGER NOT NULL DEFAULT 0,
  md1_points INTEGER DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  is_loser BOOLEAN DEFAULT FALSE,
  is_tie BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient ranking queries
CREATE INDEX IF NOT EXISTS idx_cl_table_25_26_rank ON cl_table_25_26(rank);
CREATE INDEX IF NOT EXISTS idx_cl_table_25_26_points ON cl_table_25_26(points DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE cl_table_25_26 ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Enable read access for all users" ON cl_table_25_26
    FOR SELECT USING (true);

-- Create policy for admin write access (you'll need to adjust this based on your auth setup)
CREATE POLICY "Enable write access for admin users" ON cl_table_25_26
    FOR ALL USING (auth.role() = 'admin' OR auth.uid() IN (
        SELECT id FROM auth.users WHERE email = 'admin@example.com'
    ));

-- Add some sample data for testing (you can remove this later)
INSERT INTO cl_table_25_26 (rank, team_name, user_name, avatar_url, member_number, points, md1_points, is_winner) VALUES
(1, 'Lightbringer', 'AmmarĆosović', 'https://gaming.uefa.com/assets/avatars/scarf_19_45@2x.png', 15, 112, 112, true),
(2, 'FK Stari Grad', 'FK Stari Grad', 'https://gaming.uefa.com/assets/avatars/scarf_19_45@2x.png', 3, 107, 107, true),
(3, 'CroPotter', 'Marin Marković', 'https://gaming.uefa.com/assets/avatars/scarf_19_45@2x.png', 20, 103, 103, true)
ON CONFLICT DO NOTHING;