-- =========================================================================
-- Drop unused banner_image_url and hero_image_url columns
-- Only logo_url + theme_background_image are used now.
-- =========================================================================

ALTER TABLE predictor_tournaments DROP COLUMN IF EXISTS banner_image_url;
ALTER TABLE predictor_tournaments DROP COLUMN IF EXISTS hero_image_url;
