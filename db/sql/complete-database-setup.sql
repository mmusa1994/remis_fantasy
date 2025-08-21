-- ========================================
-- COMPLETE DATABASE SETUP FOR REMIS FANTASY
-- Run this in Supabase SQL Editor
-- ========================================

-- Step 1: Update registration_25_26 table with missing columns and proper constraints
-- ================================================================================

-- Add missing columns if they don't exist
ALTER TABLE registration_25_26 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT,
ADD COLUMN IF NOT EXISTS cash_status TEXT,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_confirmed_by TEXT,
ADD COLUMN IF NOT EXISTS admin_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS h2h_category TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop existing check constraints if they exist
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_payment_method_check;
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_payment_status_check;
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_cash_status_check;
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_h2h_category_check;

-- Add proper check constraints
ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_payment_method_check 
CHECK (payment_method IN ('bank', 'wise', 'cash', 'paypal') OR payment_method IS NULL);

ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_payment_status_check 
CHECK (payment_status IN ('paid', 'pending') OR payment_status IS NULL);

ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_cash_status_check 
CHECK (cash_status IN ('paid', 'pending') OR cash_status IS NULL);

ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_h2h_category_check 
CHECK (h2h_category IN ('h2h', 'h2h2') OR h2h_category IS NULL);

-- Add constraint for points (non-negative)
ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_points_check 
CHECK (points >= 0);

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_registration_25_26_updated_at ON registration_25_26;
CREATE TRIGGER update_registration_25_26_updated_at 
    BEFORE UPDATE ON registration_25_26 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registration_25_26_payment_method ON registration_25_26(payment_method);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_payment_status ON registration_25_26(payment_status);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_cash_status ON registration_25_26(cash_status);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_h2h_league ON registration_25_26(h2h_league);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_league_type ON registration_25_26(league_type);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_points ON registration_25_26(points DESC);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_h2h_category ON registration_25_26(h2h_category);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_deleted_at ON registration_25_26(deleted_at) WHERE deleted_at IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN registration_25_26.points IS 'Fantasy points accumulated by the player';
COMMENT ON COLUMN registration_25_26.h2h_category IS 'H2H category: h2h (H2H Liga) or h2h2 (H2H2 Liga)';
COMMENT ON COLUMN registration_25_26.payment_status IS 'Payment status: paid or pending';
COMMENT ON COLUMN registration_25_26.cash_status IS 'Cash payment status: paid or pending';


-- Step 2: Create clean Premier League table
-- ========================================

-- Drop table if exists (be careful in production!)
DROP TABLE IF EXISTS premier_league_25_26;

-- Create the new clean Premier League table
CREATE TABLE premier_league_25_26 (
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

-- Create indexes for performance
CREATE INDEX idx_premier_league_25_26_league_type ON premier_league_25_26(league_type);
CREATE INDEX idx_premier_league_25_26_h2h_category ON premier_league_25_26(h2h_category);
CREATE INDEX idx_premier_league_25_26_points ON premier_league_25_26(points DESC);
CREATE INDEX idx_premier_league_25_26_position ON premier_league_25_26(position);
CREATE INDEX idx_premier_league_25_26_email ON premier_league_25_26(email);
CREATE INDEX idx_premier_league_25_26_deleted_at ON premier_league_25_26(deleted_at) WHERE deleted_at IS NULL;

-- Create composite indexes for league queries
CREATE INDEX idx_premier_league_25_26_premium_main ON premier_league_25_26(league_type, points DESC) 
WHERE league_type = 'premium' AND h2h_category IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_premier_league_25_26_standard_main ON premier_league_25_26(league_type, points DESC) 
WHERE league_type = 'standard' AND h2h_category IS NULL AND deleted_at IS NULL;

CREATE INDEX idx_premier_league_25_26_h2h ON premier_league_25_26(h2h_category, points DESC) 
WHERE h2h_category = 'h2h' AND deleted_at IS NULL;

CREATE INDEX idx_premier_league_25_26_h2h2 ON premier_league_25_26(h2h_category, points DESC) 
WHERE h2h_category = 'h2h2' AND deleted_at IS NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_premier_league_25_26_updated_at 
    BEFORE UPDATE ON premier_league_25_26 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE premier_league_25_26 IS 'Clean Premier League fantasy football table for 2025/26 season';
COMMENT ON COLUMN premier_league_25_26.league_type IS 'League type: premium or standard';
COMMENT ON COLUMN premier_league_25_26.h2h_category IS 'H2H category: h2h (H2H Liga) or h2h2 (H2H2 Liga), NULL for main leagues';
COMMENT ON COLUMN premier_league_25_26.points IS 'Fantasy points accumulated by the player';
COMMENT ON COLUMN premier_league_25_26.position IS 'Current position in the league (calculated field)';
COMMENT ON COLUMN premier_league_25_26.migrated_from_registration_id IS 'Reference to original registration_25_26 record';


-- Step 3: Migration function to populate Premier League table
-- ==========================================================

-- Create migration function
CREATE OR REPLACE FUNCTION migrate_to_premier_league()
RETURNS INTEGER AS $$
DECLARE
    migrated_count INTEGER := 0;
BEGIN
    -- Clear existing data
    DELETE FROM premier_league_25_26;
    
    -- Insert data from registration table
    INSERT INTO premier_league_25_26 (
        first_name,
        last_name,
        team_name,
        league_type,
        h2h_category,
        points,
        email,
        phone,
        created_at,
        updated_at,
        migrated_from_registration_id
    )
    SELECT 
        first_name,
        last_name,
        team_name,
        league_type,
        h2h_category,
        COALESCE(points, 0) as points,
        email,
        phone,
        created_at,
        COALESCE(updated_at, NOW()) as updated_at,
        id as migrated_from_registration_id
    FROM registration_25_26
    WHERE 
        deleted_at IS NULL
        AND league_type IN ('premium', 'standard')
        AND first_name IS NOT NULL
        AND last_name IS NOT NULL
        AND team_name IS NOT NULL
        AND email IS NOT NULL;
    
    GET DIAGNOSTICS migrated_count = ROW_COUNT;
    
    -- Update positions for each league
    PERFORM update_all_league_positions();
    
    RETURN migrated_count;
END;
$$ LANGUAGE plpgsql;


-- Step 4: Function to update league positions
-- ==========================================

CREATE OR REPLACE FUNCTION update_all_league_positions()
RETURNS VOID AS $$
BEGIN
    -- Update Premium League positions
    WITH ranked_premium AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC, created_at ASC) as new_position
        FROM premier_league_25_26
        WHERE league_type = 'premium' AND h2h_category IS NULL AND deleted_at IS NULL
    )
    UPDATE premier_league_25_26 
    SET position = ranked_premium.new_position
    FROM ranked_premium
    WHERE premier_league_25_26.id = ranked_premium.id;
    
    -- Update Standard League positions
    WITH ranked_standard AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC, created_at ASC) as new_position
        FROM premier_league_25_26
        WHERE league_type = 'standard' AND h2h_category IS NULL AND deleted_at IS NULL
    )
    UPDATE premier_league_25_26 
    SET position = ranked_standard.new_position
    FROM ranked_standard
    WHERE premier_league_25_26.id = ranked_standard.id;
    
    -- Update H2H Liga positions
    WITH ranked_h2h AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC, created_at ASC) as new_position
        FROM premier_league_25_26
        WHERE h2h_category = 'h2h' AND deleted_at IS NULL
    )
    UPDATE premier_league_25_26 
    SET position = ranked_h2h.new_position
    FROM ranked_h2h
    WHERE premier_league_25_26.id = ranked_h2h.id;
    
    -- Update H2H2 Liga positions
    WITH ranked_h2h2 AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY points DESC, created_at ASC) as new_position
        FROM premier_league_25_26
        WHERE h2h_category = 'h2h2' AND deleted_at IS NULL
    )
    UPDATE premier_league_25_26 
    SET position = ranked_h2h2.new_position
    FROM ranked_h2h2
    WHERE premier_league_25_26.id = ranked_h2h2.id;
END;
$$ LANGUAGE plpgsql;


-- Step 5: Trigger to auto-update positions when points change
-- ===========================================================

CREATE OR REPLACE FUNCTION update_league_positions_on_points_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update positions if points actually changed
    IF OLD.points IS DISTINCT FROM NEW.points THEN
        NEW.last_points_update = NOW();
        
        -- Schedule position update (will be called after transaction)
        PERFORM pg_notify('update_positions', NEW.id::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for position updates
DROP TRIGGER IF EXISTS update_positions_on_points_change ON premier_league_25_26;
CREATE TRIGGER update_positions_on_points_change
    AFTER UPDATE ON premier_league_25_26
    FOR EACH ROW
    EXECUTE FUNCTION update_league_positions_on_points_change();


-- Step 6: Run initial migration
-- =============================

-- Execute the migration
SELECT migrate_to_premier_league() as migrated_records;


-- Step 7: Verification queries
-- ============================

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'premier_league_25_26' 
ORDER BY ordinal_position;

-- Check migrated data
SELECT 
    league_type,
    h2h_category,
    COUNT(*) as player_count,
    MIN(points) as min_points,
    MAX(points) as max_points,
    AVG(points)::INTEGER as avg_points
FROM premier_league_25_26
WHERE deleted_at IS NULL
GROUP BY league_type, h2h_category
ORDER BY league_type, h2h_category;

-- Sample data from each league
SELECT 'Premium League' as league, first_name, last_name, team_name, points, position 
FROM premier_league_25_26 
WHERE league_type = 'premium' AND h2h_category IS NULL AND deleted_at IS NULL 
ORDER BY position LIMIT 5

UNION ALL

SELECT 'Standard League' as league, first_name, last_name, team_name, points, position 
FROM premier_league_25_26 
WHERE league_type = 'standard' AND h2h_category IS NULL AND deleted_at IS NULL 
ORDER BY position LIMIT 5

UNION ALL

SELECT 'H2H League' as league, first_name, last_name, team_name, points, position 
FROM premier_league_25_26 
WHERE h2h_category = 'h2h' AND deleted_at IS NULL 
ORDER BY position LIMIT 5

UNION ALL

SELECT 'H2H2 League' as league, first_name, last_name, team_name, points, position 
FROM premier_league_25_26 
WHERE h2h_category = 'h2h2' AND deleted_at IS NULL 
ORDER BY position LIMIT 5;

-- Final success message
DO $$
BEGIN
    RAISE NOTICE '🎉 Database setup completed successfully!';
    RAISE NOTICE '📊 Premier League table created and populated';
    RAISE NOTICE '🔧 All constraints, indexes, and triggers are in place';
    RAISE NOTICE '✅ Ready for admin panel integration';
END $$;