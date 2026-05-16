-- =========================================================================
-- REMIS PREDICTOR — i18n / English-language columns
-- Adds *_en counterparts to every user-facing text field so the predictor
-- admin can author bilingual (bs + en) content. The original (non-suffixed)
-- columns continue to hold the Bosnian (default) copy. The public API falls
-- back to the BS column whenever the EN column is NULL or empty.
-- =========================================================================

-- -----------------------------------------------------------------------
-- predictor_tournaments
-- -----------------------------------------------------------------------
ALTER TABLE predictor_tournaments
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS short_description_en TEXT,
  ADD COLUMN IF NOT EXISTS long_description_en TEXT,
  ADD COLUMN IF NOT EXISTS rules_md_en TEXT,
  ADD COLUMN IF NOT EXISTS point_system_md_en TEXT,
  ADD COLUMN IF NOT EXISTS eligibility_md_en TEXT;

-- -----------------------------------------------------------------------
-- predictor_categories
-- -----------------------------------------------------------------------
ALTER TABLE predictor_categories
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT,
  ADD COLUMN IF NOT EXISTS rules_md_en TEXT;

-- -----------------------------------------------------------------------
-- predictor_options
-- -----------------------------------------------------------------------
ALTER TABLE predictor_options
  ADD COLUMN IF NOT EXISTS label_en TEXT,
  ADD COLUMN IF NOT EXISTS group_label_en TEXT;

-- -----------------------------------------------------------------------
-- predictor_rules
-- -----------------------------------------------------------------------
ALTER TABLE predictor_rules
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS body_md_en TEXT;

-- -----------------------------------------------------------------------
-- predictor_rewards
-- -----------------------------------------------------------------------
ALTER TABLE predictor_rewards
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

-- -----------------------------------------------------------------------
-- predictor_matches
-- -----------------------------------------------------------------------
ALTER TABLE predictor_matches
  ADD COLUMN IF NOT EXISTS stage_label_en TEXT,
  ADD COLUMN IF NOT EXISTS match_label_en TEXT,
  ADD COLUMN IF NOT EXISTS venue_en TEXT,
  ADD COLUMN IF NOT EXISTS home_team_en TEXT,
  ADD COLUMN IF NOT EXISTS away_team_en TEXT;
