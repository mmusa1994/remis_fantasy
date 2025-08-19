-- Quick Setup for Premier League Clean Table
-- Run this in Supabase SQL Editor

-- Step 1: Ensure registration_25_26 has required columns
ALTER TABLE registration_25_26 
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS h2h_category TEXT;

-- Add constraints for payment_status and cash_status as requested
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_payment_status_check;
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_cash_status_check;

ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_payment_status_check 
CHECK (payment_status IN ('paid', 'pending') OR payment_status IS NULL);

ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_cash_status_check 
CHECK (cash_status IN ('paid', 'pending') OR cash_status IS NULL);

-- Step 2: Create the clean Premier League table
CREATE TABLE IF NOT EXISTS premier_league_25_26 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    league_type VARCHAR(50) NOT NULL CHECK (league_type IN ('premium', 'standard')),
    h2h_category VARCHAR(20) NULL CHECK (h2h_category IN ('h2h', 'h2h2')),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    position INTEGER NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Metadata
    migrated_from_registration_id UUID NULL,
    last_points_update TIMESTAMP WITH TIME ZONE NULL,
    admin_notes TEXT NULL
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_premier_league_25_26_league_type ON premier_league_25_26(league_type);
CREATE INDEX IF NOT EXISTS idx_premier_league_25_26_h2h_category ON premier_league_25_26(h2h_category);
CREATE INDEX IF NOT EXISTS idx_premier_league_25_26_points ON premier_league_25_26(points DESC);
CREATE INDEX IF NOT EXISTS idx_premier_league_25_26_position ON premier_league_25_26(position);
CREATE INDEX IF NOT EXISTS idx_premier_league_25_26_deleted_at ON premier_league_25_26(deleted_at) WHERE deleted_at IS NULL;

-- Step 4: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger for premier_league_25_26
DROP TRIGGER IF EXISTS update_premier_league_25_26_updated_at ON premier_league_25_26;
CREATE TRIGGER update_premier_league_25_26_updated_at 
    BEFORE UPDATE ON premier_league_25_26 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Premier League setup completed successfully!';
    RAISE NOTICE '🎯 You can now use the clean table admin panel';
    RAISE NOTICE '📊 Run migration to populate the table with data';
END $$;