-- =========================================================================
-- REMIS PREDICTOR — Advanced Tournament Predictions
-- Independent module: tournaments, categories, options, predictions,
-- rules, rewards. RLS disabled on writes (admin via service role), public
-- selects for published rows.
-- =========================================================================

-- -----------------------------------------------------------------------
-- helper trigger function to keep updated_at fresh
-- -----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_predictor_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------
-- predictor_tournaments
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_tournaments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT,
  long_description TEXT,
  banner_image_url TEXT,
  hero_image_url TEXT,
  logo_url TEXT,
  accent_color TEXT DEFAULT 'amber',         -- ui tint: amber/purple/blue/red/green
  status TEXT NOT NULL DEFAULT 'draft'       -- draft | published | locked | finished
    CHECK (status IN ('draft','published','locked','finished')),
  visibility TEXT NOT NULL DEFAULT 'public'  -- public | private
    CHECK (visibility IN ('public','private')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  registration_lock_at TIMESTAMPTZ,          -- global deadline; per-category lock_at can override
  rules_md TEXT,                             -- markdown body for general rules
  point_system_md TEXT,                      -- explanation of point rules
  eligibility_md TEXT,
  prize_pool_amount NUMERIC(12,2),
  prize_pool_currency TEXT DEFAULT 'EUR',
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  sponsor_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_predictor_tournaments_slug
  ON predictor_tournaments(slug);
CREATE INDEX IF NOT EXISTS idx_predictor_tournaments_status
  ON predictor_tournaments(status) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS trg_predictor_tournaments_updated_at
  ON predictor_tournaments;
CREATE TRIGGER trg_predictor_tournaments_updated_at
  BEFORE UPDATE ON predictor_tournaments
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- -----------------------------------------------------------------------
-- predictor_categories
-- A "category" is one prediction question (e.g. "Tournament Winner",
-- "Top Scorer", "Top 4 Teams"). Each has its own type and scoring.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rules_md TEXT,
  icon TEXT,                                 -- lucide icon name (e.g. "trophy")
  category_type TEXT NOT NULL DEFAULT 'single_choice'
    CHECK (category_type IN (
      'single_choice',     -- pick exactly one option
      'multiple_choice',   -- pick N options (unordered)
      'ranked_top_n',      -- pick N options ordered (e.g. top 4)
      'team_selection',    -- shorthand for single_choice over teams
      'player_selection',  -- shorthand for single_choice over players
      'exact_score',       -- enter home & away score
      'numeric',           -- free numeric guess (e.g. total goals)
      'free_text'          -- free text guess
    )),
  max_selections INT DEFAULT 1,              -- for multiple_choice / ranked_top_n
  points_correct INT NOT NULL DEFAULT 10,    -- full credit
  points_partial INT NOT NULL DEFAULT 0,     -- per-correct-option (multi)
  points_ranked_bonus INT NOT NULL DEFAULT 0,-- extra per correct rank position
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','private')),
  lock_at TIMESTAMPTZ,                       -- per-category lock; overrides tournament
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tournament_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_predictor_categories_tournament
  ON predictor_categories(tournament_id);

DROP TRIGGER IF EXISTS trg_predictor_categories_updated_at
  ON predictor_categories;
CREATE TRIGGER trg_predictor_categories_updated_at
  BEFORE UPDATE ON predictor_categories
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- -----------------------------------------------------------------------
-- predictor_options
-- Selectable answers for choice-type categories (teams, players, etc.)
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES predictor_categories(id)
    ON DELETE CASCADE,
  label TEXT NOT NULL,
  value TEXT,                                -- machine-friendly id (optional)
  image_url TEXT,
  group_label TEXT,                          -- e.g. "Group A" for groupings
  metadata JSONB DEFAULT '{}'::jsonb,
  sort_order INT DEFAULT 0,
  is_correct BOOLEAN DEFAULT FALSE,          -- set by admin after results
  correct_rank INT,                          -- for ranked_top_n (1=first, ...)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictor_options_category
  ON predictor_options(category_id);

-- -----------------------------------------------------------------------
-- predictor_predictions
-- One row per user per category. Stores selections (jsonb) or text/numeric.
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES predictor_categories(id)
    ON DELETE CASCADE,
  user_id UUID NOT NULL,                     -- references users(id) but no FK to avoid cross-domain coupling
  user_email TEXT,                           -- denormalized for admin lookups
  user_display_name TEXT,                    -- denormalized for standings
  selected_option_ids JSONB DEFAULT '[]'::jsonb, -- ordered array for ranked_top_n
  text_value TEXT,
  numeric_value NUMERIC,
  score_home INT,                            -- exact_score
  score_away INT,
  points_awarded INT DEFAULT 0,
  is_scored BOOLEAN DEFAULT FALSE,
  locked BOOLEAN DEFAULT FALSE,              -- once true, user cannot edit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_predictor_predictions_tournament
  ON predictor_predictions(tournament_id);
CREATE INDEX IF NOT EXISTS idx_predictor_predictions_user
  ON predictor_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictor_predictions_category
  ON predictor_predictions(category_id);

DROP TRIGGER IF EXISTS trg_predictor_predictions_updated_at
  ON predictor_predictions;
CREATE TRIGGER trg_predictor_predictions_updated_at
  BEFORE UPDATE ON predictor_predictions
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- -----------------------------------------------------------------------
-- predictor_rules
-- Free-form admin-managed list of rules / bonus rules / info notes
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'rule'
    CHECK (kind IN ('rule','bonus','info','deadline','eligibility')),
  title TEXT NOT NULL,
  body_md TEXT,
  icon TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictor_rules_tournament
  ON predictor_rules(tournament_id);

DROP TRIGGER IF EXISTS trg_predictor_rules_updated_at
  ON predictor_rules;
CREATE TRIGGER trg_predictor_rules_updated_at
  BEFORE UPDATE ON predictor_rules
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- -----------------------------------------------------------------------
-- predictor_rewards
-- -----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS predictor_rewards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES predictor_tournaments(id)
    ON DELETE CASCADE,
  rank_position INT,                         -- 1,2,3 ... or NULL for non-ranked
  title TEXT NOT NULL,
  description TEXT,
  prize_type TEXT NOT NULL DEFAULT 'cash'
    CHECK (prize_type IN ('cash','physical','voucher','vip','sponsor','fantasy_points','other')),
  prize_value NUMERIC(12,2),
  prize_currency TEXT DEFAULT 'EUR',
  image_url TEXT,
  sponsor_name TEXT,
  sponsor_logo_url TEXT,
  sponsor_url TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_predictor_rewards_tournament
  ON predictor_rewards(tournament_id);

DROP TRIGGER IF EXISTS trg_predictor_rewards_updated_at
  ON predictor_rewards;
CREATE TRIGGER trg_predictor_rewards_updated_at
  BEFORE UPDATE ON predictor_rewards
  FOR EACH ROW EXECUTE FUNCTION set_predictor_updated_at();

-- =========================================================================
-- Row Level Security
-- All writes go through service-role (admin API). Anonymous SELECT allowed
-- on published tournaments and their associated child rows for the public
-- predictor pages. Per-user predictions are filtered by user_id at the API
-- layer (server uses service-role), so RLS is left disabled for simplicity
-- matching the rest of the codebase. Re-enable later if migrating to RLS.
-- =========================================================================
ALTER TABLE predictor_tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_categories  DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_options     DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_rules       DISABLE ROW LEVEL SECURITY;
ALTER TABLE predictor_rewards     DISABLE ROW LEVEL SECURITY;
