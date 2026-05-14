-- =========================================================================
-- REMIS PREDICTOR — Approval-based participation
-- Admin koji je kreirao turnir odobrava koje će korisnike pustiti da
-- predviđaju. Standings ostaju javni, ali predict + match-predict APIs
-- provjeravaju approval ako je require_approval = true.
-- =========================================================================

-- 1) Toggle na turniru: zahtijeva li odobrenje za predviđanje?
ALTER TABLE predictor_tournaments
  ADD COLUMN IF NOT EXISTS require_approval BOOLEAN DEFAULT FALSE;

-- 2) Tabela članova/zahtjeva po turniru
CREATE TABLE IF NOT EXISTS predictor_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT,
  user_display_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','banned')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,                     -- email admina koji je odobrio
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_predictor_members_tournament
  ON predictor_members(tournament_id);
CREATE INDEX IF NOT EXISTS idx_predictor_members_user
  ON predictor_members(user_id);
CREATE INDEX IF NOT EXISTS idx_predictor_members_status
  ON predictor_members(tournament_id, status);

DROP TRIGGER IF EXISTS trg_predictor_members_updated_at ON predictor_members;
CREATE TRIGGER trg_predictor_members_updated_at
  BEFORE UPDATE ON predictor_members
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

ALTER TABLE predictor_members DISABLE ROW LEVEL SECURITY;
