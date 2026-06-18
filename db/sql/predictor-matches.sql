-- =========================================================================
-- REMIS PREDICTOR — Match-by-match predictions (UEFA UCL Predictor style)
-- Dopuna prvobitne migracije: utakmice + korisničke score predikcije
-- =========================================================================

-- -----------------------------------------------------------------------
-- 1) predictor_matches — fiksture/utakmice
-- Svaka utakmica pripada turniru, ima fazu (grupna/nokaut), kickoff, status.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'group',
    -- 'group_a','group_b',...,'round_of_32','round_of_16',
    -- 'quarter_final','semi_final','third_place','final','group','other'
  stage_label TEXT,                    -- prikazno ime ('Grupa A','Osmina finala')
  match_label TEXT,                    -- 'M1','R16-3','Final', itd.
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_logo_url TEXT,                  -- opcionalno (zastava ili klupski logo)
  away_logo_url TEXT,
  home_team_code TEXT,                 -- ISO ili interni kod (npr. 'br')
  away_team_code TEXT,
  venue TEXT,
  kickoff_at TIMESTAMPTZ,              -- kad počinje — auto-lock za predikcije
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','live','finished','postponed','cancelled')),
  home_score INT,                      -- konačni rezultat (admin upisuje)
  away_score INT,
  points_exact INT NOT NULL DEFAULT 3,  -- poeni za tačan rezultat
  points_diff INT NOT NULL DEFAULT 1,   -- tačna razlika se broji kao tačan ishod
  points_winner INT NOT NULL DEFAULT 1, -- poeni za tačan ishod (pobjednik / neriješeno)
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictor_matches_tournament
  ON predictor_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_predictor_matches_stage
  ON predictor_matches(tournament_id, stage);
CREATE INDEX IF NOT EXISTS idx_predictor_matches_kickoff
  ON predictor_matches(kickoff_at);
CREATE INDEX IF NOT EXISTS idx_predictor_matches_status
  ON predictor_matches(status);

DROP TRIGGER IF EXISTS trg_predictor_matches_updated_at ON predictor_matches;
CREATE TRIGGER trg_predictor_matches_updated_at
  BEFORE UPDATE ON predictor_matches
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- -----------------------------------------------------------------------
-- 2) predictor_match_predictions — korisničke predikcije po utakmici
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_match_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES predictor_matches(id)
    ON DELETE CASCADE,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT,
  user_display_name TEXT,
  home_score INT NOT NULL,
  away_score INT NOT NULL,
  points_awarded INT DEFAULT 0,
  is_scored BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, match_id)
);

CREATE INDEX IF NOT EXISTS idx_predictor_match_preds_match
  ON predictor_match_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictor_match_preds_user
  ON predictor_match_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictor_match_preds_tournament
  ON predictor_match_predictions(tournament_id);

DROP TRIGGER IF EXISTS trg_predictor_match_preds_updated_at
  ON predictor_match_predictions;
CREATE TRIGGER trg_predictor_match_preds_updated_at
  BEFORE UPDATE ON predictor_match_predictions
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- RLS isključen — admin koristi service role kao i ostatak modula
ALTER TABLE predictor_matches             DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_match_predictions   DISABLE ROW LEVEL SECURITY;
