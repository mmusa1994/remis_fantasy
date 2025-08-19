-- Create Champion League table
CREATE TABLE IF NOT EXISTS champion_league_25_26 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  team_name VARCHAR(255) NOT NULL,
  points INTEGER DEFAULT 0,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
  cash_status VARCHAR(20) DEFAULT 'pending' CHECK (cash_status IN ('paid', 'pending')),
  payment_proof_url TEXT,
  payment_amount DECIMAL(10,2),
  payment_date TIMESTAMPTZ,
  admin_notes TEXT,
  admin_confirmed_by VARCHAR(255),
  admin_confirmed_at TIMESTAMPTZ,
  registration_email_sent BOOLEAN DEFAULT FALSE,
  codes_email_sent BOOLEAN DEFAULT FALSE,
  email_template_type VARCHAR(50),
  registration_email_sent_at TIMESTAMPTZ,
  codes_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Create F1 table
CREATE TABLE IF NOT EXISTS f1_25_26 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  team_name VARCHAR(255) NOT NULL,
  points INTEGER DEFAULT 0,
  payment_method VARCHAR(50),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending')),
  cash_status VARCHAR(20) DEFAULT 'pending' CHECK (cash_status IN ('paid', 'pending')), 
  payment_proof_url TEXT,
  payment_amount DECIMAL(10,2),
  payment_date TIMESTAMPTZ,
  admin_notes TEXT,
  admin_confirmed_by VARCHAR(255),
  admin_confirmed_at TIMESTAMPTZ,
  registration_email_sent BOOLEAN DEFAULT FALSE,
  codes_email_sent BOOLEAN DEFAULT FALSE,
  email_template_type VARCHAR(50),
  registration_email_sent_at TIMESTAMPTZ,
  codes_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_champion_league_points ON champion_league_25_26(points DESC);
CREATE INDEX IF NOT EXISTS idx_champion_league_email ON champion_league_25_26(email);
CREATE INDEX IF NOT EXISTS idx_champion_league_deleted ON champion_league_25_26(deleted_at);

CREATE INDEX IF NOT EXISTS idx_f1_points ON f1_25_26(points DESC);
CREATE INDEX IF NOT EXISTS idx_f1_email ON f1_25_26(email);
CREATE INDEX IF NOT EXISTS idx_f1_deleted ON f1_25_26(deleted_at);

-- Add comments for documentation
COMMENT ON TABLE champion_league_25_26 IS 'Champion League fantasy football registrations for 2025/26 season';
COMMENT ON TABLE f1_25_26 IS 'Formula 1 fantasy registrations for 2025/26 season';

COMMENT ON COLUMN champion_league_25_26.points IS 'Fantasy points accumulated by the player in Champion League competition';
COMMENT ON COLUMN f1_25_26.points IS 'Fantasy points accumulated by the player in F1 competition';

-- Enable Row Level Security (if needed)
-- ALTER TABLE champion_league_25_26 ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE f1_25_26 ENABLE ROW LEVEL SECURITY;