-- PL 26/27 — FPL sync: stabilno spajanje redova po FPL entry ID-u.
-- Bez ove kolone sync i dalje radi (spaja po emailu / imenu tima / imenu),
-- ali sa njom promjena imena tima na FPL-u ne pravi duplikat.
-- Idempotentno. Ne dira tabele prijava (registration_*).

ALTER TABLE premier_league_26_27
  ADD COLUMN IF NOT EXISTS fpl_entry_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_premier_league_26_27_fpl_entry
  ON premier_league_26_27(fpl_entry_id) WHERE deleted_at IS NULL;
