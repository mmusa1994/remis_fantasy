-- Normalizuj bodovanje utakmica na dogovoreni princip:
--   tačan rezultat   → 3 boda
--   tačan ishod      → 1 bod   (pobjednik ili neriješeno; tačna razlika se broji ovdje)
--   pogrešan ishod   → 0 bodova
--
-- computeMatchPoints() vraća najviši primjenjivi nivo, pa kad su points_diff i
-- points_winner oba 1, svaki tačan ishod daje tačno 1 bod, a tačan rezultat 3.
-- Stare utakmice su kreirane sa 5/3/2 — ova migracija ih izjednačava sa 3/1/1.
UPDATE predictor_matches
SET points_exact = 3,
    points_diff = 1,
    points_winner = 1
WHERE points_exact <> 3
   OR points_diff <> 1
   OR points_winner <> 1;

-- NAPOMENA: nakon ovoga pokreni "Rebodovanje" (rescore-all) da se već odigrane
-- utakmice ponovo boduju po novim vrijednostima i da se zakašnjele predikcije
-- (upisane nakon rezultata) konačno boduju umjesto da stoje na 0.
