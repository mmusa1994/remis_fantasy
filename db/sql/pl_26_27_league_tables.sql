-- Premier League 26/27 — tabele za standings nove sezone.
-- Kreira premier_league_26_27 (Premium/Standard/Free, klasično bodovanje)
-- i h2h_league_26_27 (H2H/H2H2), po uzoru na 25/26 tabele, uključujući
-- relaksirani league_type CHECK i RLS politike za javno čitanje (anon).
-- Pokrenuti u Supabase SQL Editoru PRIJE nego što admin počne unositi
-- podatke nove sezone. Public API (/api/premier-league-tables?season=26_27)
-- do tada prikazuje praznu novu sezonu (graceful 42P01 fallback).

-- ============================================================
-- 1) Klasične lige: premier_league_26_27
-- ============================================================
CREATE TABLE IF NOT EXISTS premier_league_26_27 (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    league_type VARCHAR(50) DEFAULT 'standard'
        CHECK (
            league_type IS NULL
            OR league_type = ''
            OR league_type IN ('premium', 'standard', 'h2h', 'free')
        ),
    h2h_category VARCHAR(20) NULL CHECK (h2h_category IN ('h2h', 'h2h2')),
    points INTEGER DEFAULT 0 CHECK (points >= 0),
    position INTEGER NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,

    migrated_from_registration_id UUID NULL,
    last_points_update TIMESTAMP WITH TIME ZONE NULL,
    admin_notes TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_premier_league_26_27_league_type ON premier_league_26_27(league_type);
CREATE INDEX IF NOT EXISTS idx_premier_league_26_27_points ON premier_league_26_27(points DESC);
CREATE INDEX IF NOT EXISTS idx_premier_league_26_27_email ON premier_league_26_27(email);
CREATE INDEX IF NOT EXISTS idx_premier_league_26_27_deleted_at ON premier_league_26_27(deleted_at) WHERE deleted_at IS NULL;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_premier_league_26_27_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS premier_league_26_27_updated_at_trigger ON premier_league_26_27;
CREATE TRIGGER premier_league_26_27_updated_at_trigger
    BEFORE UPDATE ON premier_league_26_27
    FOR EACH ROW
    EXECUTE FUNCTION update_premier_league_26_27_updated_at();

-- RLS: javno čitanje (samo neobrisani redovi), service role sve
ALTER TABLE premier_league_26_27 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to premier_league_26_27" ON premier_league_26_27;
CREATE POLICY "Allow public read access to premier_league_26_27" ON premier_league_26_27
    FOR SELECT
    TO public
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "Allow service role full access to premier_league_26_27" ON premier_league_26_27;
CREATE POLICY "Allow service role full access to premier_league_26_27" ON premier_league_26_27
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

GRANT SELECT ON premier_league_26_27 TO anon, authenticated;
GRANT ALL ON premier_league_26_27 TO service_role;

-- ============================================================
-- 2) H2H lige: h2h_league_26_27
-- ============================================================
CREATE TABLE IF NOT EXISTS h2h_league_26_27 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    team_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),

    h2h_category VARCHAR(20) NOT NULL CHECK (h2h_category IN ('h2h', 'h2h2')),
    h2h_points INTEGER DEFAULT 0,
    h2h_stats JSONB DEFAULT '{"w": 0, "d": 0, "l": 0}'::jsonb,
    points_for INTEGER DEFAULT 0,
    position INTEGER,

    fpl_entry_id INTEGER,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    last_points_update TIMESTAMP WITH TIME ZONE,

    admin_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_h2h_league_26_27_category ON h2h_league_26_27(h2h_category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_h2h_league_26_27_h2h_points ON h2h_league_26_27(h2h_category, h2h_points DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_h2h_league_26_27_fpl_entry ON h2h_league_26_27(fpl_entry_id) WHERE deleted_at IS NULL;

CREATE OR REPLACE FUNCTION update_h2h_league_26_27_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS h2h_league_26_27_updated_at_trigger ON h2h_league_26_27;
CREATE TRIGGER h2h_league_26_27_updated_at_trigger
    BEFORE UPDATE ON h2h_league_26_27
    FOR EACH ROW
    EXECUTE FUNCTION update_h2h_league_26_27_updated_at();

ALTER TABLE h2h_league_26_27 ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "h2h_league_26_27_public_read" ON h2h_league_26_27;
CREATE POLICY "h2h_league_26_27_public_read" ON h2h_league_26_27
    FOR SELECT
    TO public
    USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "h2h_league_26_27_service_all" ON h2h_league_26_27;
CREATE POLICY "h2h_league_26_27_service_all" ON h2h_league_26_27
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

GRANT SELECT ON h2h_league_26_27 TO anon, authenticated;
GRANT ALL ON h2h_league_26_27 TO service_role;
