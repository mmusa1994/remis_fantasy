-- =========================================================================
-- One-shot fix: swap Wikipedia URLs for local logos under /public/old-cup
-- Safe to run multiple times — only updates rows whose logo_url still
-- points at upload.wikimedia.org. Rebrands "SP 2014" -> "SP 2018" since the
-- local file is wc-2018.png.
-- =========================================================================

UPDATE predictor_eternal_columns
   SET label = 'SP 2018',
       logo_url = '/old-cup/wc-2018.png'
 WHERE label = 'SP 2014';

UPDATE predictor_eternal_columns
   SET logo_url = '/old-cup/euro-20.png'
 WHERE label = 'Euro 2020'
   AND logo_url LIKE 'https://upload.wikimedia.org/%';

UPDATE predictor_eternal_columns
   SET logo_url = '/old-cup/wc-22.png'
 WHERE label = 'SP 2022'
   AND logo_url LIKE 'https://upload.wikimedia.org/%';

UPDATE predictor_eternal_columns
   SET logo_url = '/old-cup/euro-24.png'
 WHERE label = 'Euro 2024'
   AND logo_url LIKE 'https://upload.wikimedia.org/%';
