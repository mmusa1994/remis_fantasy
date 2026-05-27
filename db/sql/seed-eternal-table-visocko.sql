-- =========================================================================
-- Seed — Eternal Table for "visocko-trece-poluvrijeme"
-- Run AFTER db/sql/predictor-eternal-table.sql has created the tables.
-- Idempotent guard: bails out if columns already exist for the tournament.
-- =========================================================================

DO $$
DECLARE
  v_tournament_id UUID;
  v_col_sp2014    UUID;
  v_col_euro2020  UUID;
  v_col_sp2022    UUID;
  v_col_euro2024  UUID;
  v_existing      INT;
BEGIN
  SELECT id
    INTO v_tournament_id
    FROM predictor_tournaments
   WHERE slug = 'visocko-trece-poluvrijeme'
     AND deleted_at IS NULL
   LIMIT 1;

  IF v_tournament_id IS NULL THEN
    RAISE EXCEPTION 'Tournament with slug visocko-trece-poluvrijeme not found';
  END IF;

  SELECT COUNT(*)
    INTO v_existing
    FROM predictor_eternal_columns
   WHERE tournament_id = v_tournament_id;

  IF v_existing > 0 THEN
    RAISE NOTICE 'Eternal table already seeded for %, skipping.', v_tournament_id;
    RETURN;
  END IF;

  -- Columns (chronological). Logos served from /public/old-cup.
  INSERT INTO predictor_eternal_columns (tournament_id, label, logo_url, sort_order)
    VALUES (v_tournament_id, 'SP 2018',  '/old-cup/wc-2018.png', 0)
    RETURNING id INTO v_col_sp2014;

  INSERT INTO predictor_eternal_columns (tournament_id, label, logo_url, sort_order)
    VALUES (v_tournament_id, 'Euro 2020', '/old-cup/euro-20.png', 1)
    RETURNING id INTO v_col_euro2020;

  INSERT INTO predictor_eternal_columns (tournament_id, label, logo_url, sort_order)
    VALUES (v_tournament_id, 'SP 2022', '/old-cup/wc-22.png', 2)
    RETURNING id INTO v_col_sp2022;

  INSERT INTO predictor_eternal_columns (tournament_id, label, logo_url, sort_order)
    VALUES (v_tournament_id, 'Euro 2024', '/old-cup/euro-24.png', 3)
    RETURNING id INTO v_col_euro2024;

  -- Entries (player rows). NULL = did not compete in that tournament.
  -- Values are stored as JSONB keyed by column UUID; total is computed at read time.
  INSERT INTO predictor_eternal_entries (tournament_id, player_name, values, sort_order) VALUES
    (v_tournament_id, 'ČOSA',    jsonb_build_object(v_col_sp2014::text, 62, v_col_euro2020::text, 58, v_col_sp2022::text, 74, v_col_euro2024::text, 58), 0),
    (v_tournament_id, 'PECA',    jsonb_build_object(v_col_sp2014::text, 64, v_col_euro2020::text, 51, v_col_sp2022::text, 69, v_col_euro2024::text, 62), 1),
    (v_tournament_id, 'ENES',    jsonb_build_object(v_col_sp2014::text, 63, v_col_euro2020::text, 61, v_col_sp2022::text, 60, v_col_euro2024::text, 47), 2),
    (v_tournament_id, 'SEMAN',   jsonb_build_object(v_col_sp2014::text, 62, v_col_euro2020::text, 51, v_col_sp2022::text, 56, v_col_euro2024::text, 60), 3),
    (v_tournament_id, 'BALTA',   jsonb_build_object(v_col_sp2014::text, 63, v_col_euro2020::text, 54, v_col_sp2022::text, 53, v_col_euro2024::text, 53), 4),
    (v_tournament_id, 'ČABA',    jsonb_build_object(v_col_sp2014::text, 58, v_col_euro2020::text, 55, v_col_sp2022::text, 56, v_col_euro2024::text, 50), 5),
    (v_tournament_id, 'DŽENO',   jsonb_build_object(v_col_sp2014::text, 54, v_col_euro2020::text, 50, v_col_sp2022::text, 62, v_col_euro2024::text, 59), 6),
    (v_tournament_id, 'VLADAN',  jsonb_build_object(v_col_sp2014::text, 62, v_col_euro2020::text, 51, v_col_sp2022::text, 48, v_col_euro2024::text, 53), 7),
    (v_tournament_id, 'MUSA',    jsonb_build_object(v_col_sp2014::text, 56, v_col_euro2020::text, 44, v_col_sp2022::text, 56, v_col_euro2024::text, 47), 8),
    (v_tournament_id, 'ČIBU',    jsonb_build_object(v_col_sp2014::text, 47, v_col_euro2020::text, 44, v_col_sp2022::text, 47, v_col_euro2024::text, 52), 9),
    (v_tournament_id, 'MUGE',    jsonb_build_object(v_col_euro2020::text, 38, v_col_sp2022::text, 69, v_col_euro2024::text, 62), 10),
    (v_tournament_id, 'HARUN',   jsonb_build_object(v_col_euro2020::text, 37, v_col_sp2022::text, 56, v_col_euro2024::text, 54), 11),
    (v_tournament_id, 'EMIN',    jsonb_build_object(v_col_sp2022::text, 67, v_col_euro2024::text, 56), 12),
    (v_tournament_id, 'SKOLE',   jsonb_build_object(v_col_sp2022::text, 56, v_col_euro2024::text, 59), 13),
    (v_tournament_id, 'FADIL',   jsonb_build_object(v_col_sp2022::text, 58, v_col_euro2024::text, 51), 14),
    (v_tournament_id, 'OMAN',    jsonb_build_object(v_col_sp2022::text, 45, v_col_euro2024::text, 60), 15),
    (v_tournament_id, 'SAMIR',   jsonb_build_object(v_col_sp2022::text, 55, v_col_euro2024::text, 48), 16),
    (v_tournament_id, 'NINO',    jsonb_build_object(v_col_sp2022::text, 61, v_col_euro2024::text, 41), 17),
    (v_tournament_id, 'MAHIR',   jsonb_build_object(v_col_sp2014::text, 66), 18),
    (v_tournament_id, 'ŠUFTO',   jsonb_build_object(v_col_sp2014::text, 66), 19),
    (v_tournament_id, 'MIMKE',   jsonb_build_object(v_col_sp2014::text, 59), 20),
    (v_tournament_id, 'DINO',    jsonb_build_object(v_col_sp2022::text, 45), 21),
    (v_tournament_id, 'BULJINA', jsonb_build_object(v_col_euro2024::text, 43), 22);

  RAISE NOTICE 'Seeded eternal table for tournament %', v_tournament_id;
END $$;
