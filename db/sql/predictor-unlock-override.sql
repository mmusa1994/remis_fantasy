-- =========================================================================
-- REMIS PREDICTOR — Manual unlock override
-- Default ponašanje: utakmica se automatski zaključava u trenutku kickoff_at.
-- Admin može ručno OTKLJUČATI utakmicu (force_unlocked=true) da bi produžio
-- rok za predikcije (npr. zbog odgađanja utakmice ili greške u rasporedu).
-- =========================================================================

ALTER TABLE predictor_matches
  ADD COLUMN IF NOT EXISTS force_unlocked BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_predictor_matches_force_unlocked
  ON predictor_matches(force_unlocked) WHERE force_unlocked = TRUE;
