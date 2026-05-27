-- =========================================================================
-- PREDICTOR — Eternal Table (Vječna tabela)
-- Per-tournament, owner-editable all-time standings across multiple
-- historical competitions. Each tournament can define N columns
-- (e.g. SP 2014, Euro 2020) and M entries (players). Totals are computed
-- on the fly; nothing is stored as a denormalized total.
-- =========================================================================

-- -----------------------------------------------------------------------
-- predictor_eternal_columns — historical competition columns
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_eternal_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  label TEXT NOT NULL,                       -- e.g. "SP 2014", "Euro 2020"
  logo_url TEXT,                             -- optional column logo
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictor_eternal_columns_tournament
  ON predictor_eternal_columns(tournament_id, sort_order);

DROP TRIGGER IF EXISTS trg_predictor_eternal_columns_updated_at
  ON predictor_eternal_columns;
CREATE TRIGGER trg_predictor_eternal_columns_updated_at
  BEFORE UPDATE ON predictor_eternal_columns
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- -----------------------------------------------------------------------
-- predictor_eternal_entries — one row per player; values keyed by column id
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_eternal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  player_name TEXT NOT NULL,                 -- e.g. "ČOSA"
  values JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "<column_id>": 62, ... }
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictor_eternal_entries_tournament
  ON predictor_eternal_entries(tournament_id, sort_order);

DROP TRIGGER IF EXISTS trg_predictor_eternal_entries_updated_at
  ON predictor_eternal_entries;
CREATE TRIGGER trg_predictor_eternal_entries_updated_at
  BEFORE UPDATE ON predictor_eternal_entries
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- -----------------------------------------------------------------------
-- RLS — disabled (service-role API writes); public read is granted.
-- Same pattern as the rest of the predictor module.
-- -----------------------------------------------------------------------
ALTER TABLE predictor_eternal_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_eternal_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access" ON predictor_eternal_columns;
CREATE POLICY "Service role full access" ON predictor_eternal_columns
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access" ON predictor_eternal_entries;
CREATE POLICY "Service role full access" ON predictor_eternal_entries
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public read columns" ON predictor_eternal_columns;
CREATE POLICY "Public read columns" ON predictor_eternal_columns
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read entries" ON predictor_eternal_entries;
CREATE POLICY "Public read entries" ON predictor_eternal_entries
  FOR SELECT USING (true);
