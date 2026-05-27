-- =========================================================================
-- PREDICTOR — Eternal Exact Table (Vječna tabela tačnih pogodaka)
-- Separate tables from the points-based eternal table.
-- Same schema, different data.
-- =========================================================================

CREATE TABLE IF NOT EXISTS predictor_eternal_exact_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  label TEXT NOT NULL,
  logo_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictor_eternal_exact_columns_tournament
  ON predictor_eternal_exact_columns(tournament_id, sort_order);

DROP TRIGGER IF EXISTS trg_predictor_eternal_exact_columns_updated_at
  ON predictor_eternal_exact_columns;
CREATE TRIGGER trg_predictor_eternal_exact_columns_updated_at
  BEFORE UPDATE ON predictor_eternal_exact_columns
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

CREATE TABLE IF NOT EXISTS predictor_eternal_exact_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  values JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictor_eternal_exact_entries_tournament
  ON predictor_eternal_exact_entries(tournament_id, sort_order);

DROP TRIGGER IF EXISTS trg_predictor_eternal_exact_entries_updated_at
  ON predictor_eternal_exact_entries;
CREATE TRIGGER trg_predictor_eternal_exact_entries_updated_at
  BEFORE UPDATE ON predictor_eternal_exact_entries
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- RLS
ALTER TABLE predictor_eternal_exact_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_eternal_exact_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON predictor_eternal_exact_columns;
CREATE POLICY "Service role full access" ON predictor_eternal_exact_columns
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON predictor_eternal_exact_entries;
CREATE POLICY "Service role full access" ON predictor_eternal_exact_entries
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read columns" ON predictor_eternal_exact_columns;
CREATE POLICY "Public read columns" ON predictor_eternal_exact_columns
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read entries" ON predictor_eternal_exact_entries;
CREATE POLICY "Public read entries" ON predictor_eternal_exact_entries
  FOR SELECT USING (true);
