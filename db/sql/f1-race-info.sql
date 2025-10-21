-- Create table for F1 race info
CREATE TABLE IF NOT EXISTS f1_race_info (
  id INT PRIMARY KEY DEFAULT 1,
  next_race VARCHAR(100) NOT NULL,
  last_race VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert initial data
INSERT INTO f1_race_info (id, next_race, last_race)
VALUES (1, 'Austin', 'Singapore')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE f1_race_info ENABLE ROW LEVEL SECURITY;

-- Policy for reading (public access)
CREATE POLICY "Allow public read access on f1_race_info"
ON f1_race_info
FOR SELECT
TO public
USING (true);

-- Policy for updating (authenticated users only)
CREATE POLICY "Allow authenticated update access on f1_race_info"
ON f1_race_info
FOR UPDATE
TO authenticated
USING (true);
