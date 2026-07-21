-- Premier League 26/27 — dopuna postojećih standings tabela.
-- premier_league_26_27 i h2h_league_26_27 VEĆ POSTOJE u živoj bazi
-- (kreirane ranije, anon read potvrđeno radi) — ova skripta samo dodaje
-- kolone koje fale za admin FPL sync i izjednačava shemu sa 25/26.
-- Idempotentna: bezbjedno pokrenuti više puta u Supabase SQL Editoru.

-- H2H tabela: kolone potrebne za admin editor i FPL sync
ALTER TABLE h2h_league_26_27
  ADD COLUMN IF NOT EXISTS fpl_entry_id INTEGER,
  ADD COLUMN IF NOT EXISTS position INTEGER,
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Klasična tabela: legacy/metadata kolone radi paritetne sheme sa 25/26
ALTER TABLE premier_league_26_27
  ADD COLUMN IF NOT EXISTS h2h_category VARCHAR(20),
  ADD COLUMN IF NOT EXISTS migrated_from_registration_id UUID;

-- Indeksi za upite po ligama
CREATE INDEX IF NOT EXISTS idx_premier_league_26_27_points
  ON premier_league_26_27(points DESC);
CREATE INDEX IF NOT EXISTS idx_premier_league_26_27_league_type
  ON premier_league_26_27(league_type);
CREATE INDEX IF NOT EXISTS idx_h2h_league_26_27_h2h_points
  ON h2h_league_26_27(h2h_category, h2h_points DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_h2h_league_26_27_fpl_entry
  ON h2h_league_26_27(fpl_entry_id) WHERE deleted_at IS NULL;

-- updated_at trigeri
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

CREATE OR REPLACE FUNCTION update_h2h_league_26_27_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS h2h_league_26_27_updated_at_trigger ON h2h_league_26_27;
CREATE TRIGGER h2h_league_26_27_updated_at_trigger
    BEFORE UPDATE ON h2h_league_26_27
    FOR EACH ROW
    EXECUTE FUNCTION update_h2h_league_26_27_updated_at();
