-- =========================================================================
-- Public tournament creation: user ownership + 2 EUR Stripe payment + admin-grantable credits
-- Run once in Supabase SQL editor.
-- =========================================================================

-- 1) Tournament ownership and provenance
ALTER TABLE predictor_tournaments
  ADD COLUMN IF NOT EXISTS owner_user_id UUID,
  ADD COLUMN IF NOT EXISTS created_via TEXT DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10,2);

-- Drop legacy check if present so we can recreate with the full set of allowed values
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'predictor_tournaments_created_via_check'
  ) THEN
    ALTER TABLE predictor_tournaments DROP CONSTRAINT predictor_tournaments_created_via_check;
  END IF;
END $$;

ALTER TABLE predictor_tournaments
  ADD CONSTRAINT predictor_tournaments_created_via_check
  CHECK (created_via IN ('admin', 'user_paid', 'user_credit', 'admin_for_user'));

CREATE INDEX IF NOT EXISTS idx_predictor_tournaments_owner
  ON predictor_tournaments(owner_user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_predictor_tournaments_stripe_pi
  ON predictor_tournaments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- 2) Per-user tournament-creation credit counter (admin grants free creations)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tournament_create_credits INT NOT NULL DEFAULT 0;

-- 3) Audit trail for admin credit grants
CREATE TABLE IF NOT EXISTS tournament_credit_grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  granted_by_admin_id UUID NOT NULL,
  amount INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournament_credit_grants_user
  ON tournament_credit_grants(user_id);

ALTER TABLE tournament_credit_grants DISABLE ROW LEVEL SECURITY;
