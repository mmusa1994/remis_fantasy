-- =========================================================================
-- REMIS PREDICTOR. Prediction lock mode + matchday grouping
-- Two modes:
--   per_match  (default): each match locks at its own kickoff_at
--   per_round:            all matches in a matchday lock at the earliest
--                         kickoff_at in that matchday group
-- =========================================================================

ALTER TABLE predictor_tournaments
  ADD COLUMN IF NOT EXISTS prediction_lock_mode TEXT
    DEFAULT 'per_match'
    CHECK (prediction_lock_mode IN ('per_match', 'per_round'));

ALTER TABLE predictor_matches
  ADD COLUMN IF NOT EXISTS matchday INT;

CREATE INDEX IF NOT EXISTS idx_predictor_matches_matchday
  ON predictor_matches(tournament_id, matchday)
  WHERE matchday IS NOT NULL;
