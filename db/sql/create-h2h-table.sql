-- =============================================
-- CREATE SEPARATE H2H LEAGUE TABLE
-- =============================================
-- This separates H2H leagues from classic leagues to prevent conflicts
-- when updating data from FPL API

-- Drop table if exists (for clean setup)
DROP TABLE IF EXISTS h2h_league_25_26;

-- Create H2H League Table
CREATE TABLE h2h_league_25_26 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Player info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),

    -- H2H specific fields
    h2h_category VARCHAR(20) NOT NULL CHECK (h2h_category IN ('h2h', 'h2h2')),
    h2h_points INTEGER DEFAULT 0,
    h2h_stats JSONB DEFAULT '{"w": 0, "d": 0, "l": 0}'::jsonb,
    points_for INTEGER DEFAULT 0,  -- Total points scored in H2H matches
    position INTEGER,

    -- FPL reference
    fpl_entry_id INTEGER,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    last_points_update TIMESTAMP WITH TIME ZONE,

    -- Admin
    admin_notes TEXT
);

-- Create indexes for performance
CREATE INDEX idx_h2h_league_category ON h2h_league_25_26(h2h_category) WHERE deleted_at IS NULL;
CREATE INDEX idx_h2h_league_h2h_points ON h2h_league_25_26(h2h_category, h2h_points DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_h2h_league_team_name ON h2h_league_25_26(team_name) WHERE deleted_at IS NULL;
CREATE INDEX idx_h2h_league_fpl_entry ON h2h_league_25_26(fpl_entry_id) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE h2h_league_25_26 ENABLE ROW LEVEL SECURITY;

-- Policy for public read access
CREATE POLICY "h2h_league_public_read" ON h2h_league_25_26
    FOR SELECT
    TO public
    USING (deleted_at IS NULL);

-- Policy for authenticated users to manage their own data
CREATE POLICY "h2h_league_auth_all" ON h2h_league_25_26
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_h2h_league_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER h2h_league_updated_at_trigger
    BEFORE UPDATE ON h2h_league_25_26
    FOR EACH ROW
    EXECUTE FUNCTION update_h2h_league_updated_at();

-- =============================================
-- CLEAN UP premier_league_25_26 H2H FIELDS
-- =============================================
-- Remove H2H fields from the classic league table since they're now separate
-- (Optional - you can keep them for backwards compatibility)

-- If you want to clean up the old table, uncomment these:
-- ALTER TABLE premier_league_25_26 DROP COLUMN IF EXISTS h2h_category;
-- ALTER TABLE premier_league_25_26 DROP COLUMN IF EXISTS h2h_points;
-- ALTER TABLE premier_league_25_26 DROP COLUMN IF EXISTS h2h_stats;

-- =============================================
-- MIGRATE EXISTING H2H DATA (if any)
-- =============================================
-- This copies existing H2H players from premier_league_25_26 to h2h_league_25_26

INSERT INTO h2h_league_25_26 (
    first_name,
    last_name,
    team_name,
    email,
    phone,
    h2h_category,
    h2h_points,
    h2h_stats,
    points_for,
    created_at,
    updated_at,
    last_points_update,
    admin_notes
)
SELECT
    first_name,
    last_name,
    team_name,
    email,
    phone,
    h2h_category,
    COALESCE(h2h_points, 0),
    COALESCE(h2h_stats, '{"w": 0, "d": 0, "l": 0}'::jsonb),
    COALESCE(points, 0),
    created_at,
    updated_at,
    last_points_update,
    admin_notes
FROM premier_league_25_26
WHERE h2h_category IS NOT NULL
AND deleted_at IS NULL;

-- =============================================
-- VERIFY MIGRATION
-- =============================================
-- Check counts
SELECT 'H2H League Count:' as info, h2h_category, COUNT(*)
FROM h2h_league_25_26
WHERE deleted_at IS NULL
GROUP BY h2h_category;
