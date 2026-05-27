-- =========================================================================
-- Seed — Eternal Exact Table for "visocko-trece-poluvrijeme"
-- Run AFTER predictor-eternal-table-type.sql has created the exact tables.
-- Idempotent: skips if exact columns already exist.
-- =========================================================================

DO $$
DECLARE
  v_tournament_id UUID;
  v_col_sp2018    UUID;
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
    FROM predictor_eternal_exact_columns
   WHERE tournament_id = v_tournament_id;

  IF v_existing > 0 THEN
    RAISE NOTICE 'Exact eternal table already seeded for %, skipping.', v_tournament_id;
    RETURN;
  END IF;

  INSERT INTO predictor_eternal_exact_columns (tournament_id, label, logo_url, sort_order)
    VALUES (v_tournament_id, 'SP 2018',   '/old-cup/wc-2018.png', 0)
    RETURNING id INTO v_col_sp2018;

  INSERT INTO predictor_eternal_exact_columns (tournament_id, label, logo_url, sort_order)
    VALUES (v_tournament_id, 'Euro 2020', '/old-cup/euro-20.png', 1)
    RETURNING id INTO v_col_euro2020;

  INSERT INTO predictor_eternal_exact_columns (tournament_id, label, logo_url, sort_order)
    VALUES (v_tournament_id, 'SP 2022',   '/old-cup/wc-22.png',  2)
    RETURNING id INTO v_col_sp2022;

  INSERT INTO predictor_eternal_exact_columns (tournament_id, label, logo_url, sort_order)
    VALUES (v_tournament_id, 'Euro 2024', '/old-cup/euro-24.png', 3)
    RETURNING id INTO v_col_euro2024;

  INSERT INTO predictor_eternal_exact_entries (tournament_id, player_name, values, sort_order) VALUES
    (v_tournament_id, 'ČOSA',    jsonb_build_object(v_col_sp2018::text, 5,  v_col_euro2020::text, 8, v_col_sp2022::text, 10, v_col_euro2024::text, 9), 0),
    (v_tournament_id, 'SEMAN',   jsonb_build_object(v_col_sp2018::text, 6,  v_col_euro2020::text, 8, v_col_sp2022::text, 5,  v_col_euro2024::text, 8), 1),
    (v_tournament_id, 'ENES',    jsonb_build_object(v_col_sp2018::text, 5,  v_col_euro2020::text, 8, v_col_sp2022::text, 6,  v_col_euro2024::text, 6), 2),
    (v_tournament_id, 'PECA',    jsonb_build_object(v_col_sp2018::text, 5,  v_col_euro2020::text, 4, v_col_sp2022::text, 8,  v_col_euro2024::text, 7), 3),
    (v_tournament_id, 'ČABA',    jsonb_build_object(v_col_sp2018::text, 2,  v_col_euro2020::text, 7, v_col_sp2022::text, 5,  v_col_euro2024::text, 7), 4),
    (v_tournament_id, 'DŽENO',   jsonb_build_object(v_col_sp2018::text, 5,  v_col_euro2020::text, 2, v_col_sp2022::text, 6,  v_col_euro2024::text, 7), 5),
    (v_tournament_id, 'VLADAN',  jsonb_build_object(v_col_sp2018::text, 6,  v_col_euro2020::text, 4, v_col_sp2022::text, 2,  v_col_euro2024::text, 8), 6),
    (v_tournament_id, 'BALTA',   jsonb_build_object(v_col_sp2018::text, 5,  v_col_euro2020::text, 5, v_col_sp2022::text, 1,  v_col_euro2024::text, 7), 7),
    (v_tournament_id, 'MUGE',    jsonb_build_object(v_col_euro2020::text, 2, v_col_sp2022::text, 6,  v_col_euro2024::text, 7), 8),
    (v_tournament_id, 'HARUN',   jsonb_build_object(v_col_euro2020::text, 2, v_col_sp2022::text, 8,  v_col_euro2024::text, 5), 9),
    (v_tournament_id, 'MUSA',    jsonb_build_object(v_col_sp2018::text, 5,  v_col_euro2020::text, 3, v_col_sp2022::text, 2,  v_col_euro2024::text, 4), 10),
    (v_tournament_id, 'ČIBU',    jsonb_build_object(v_col_sp2018::text, 1,  v_col_euro2020::text, 3, v_col_sp2022::text, 4,  v_col_euro2024::text, 5), 11),
    (v_tournament_id, 'FADIL',   jsonb_build_object(v_col_sp2022::text, 7,  v_col_euro2024::text, 6), 12),
    (v_tournament_id, 'SKOLE',   jsonb_build_object(v_col_sp2022::text, 5,  v_col_euro2024::text, 8), 13),
    (v_tournament_id, 'EMIN',    jsonb_build_object(v_col_sp2022::text, 5,  v_col_euro2024::text, 7), 14),
    (v_tournament_id, 'SAMIR',   jsonb_build_object(v_col_sp2022::text, 5,  v_col_euro2024::text, 6), 15),
    (v_tournament_id, 'OMAN',    jsonb_build_object(v_col_sp2022::text, 1,  v_col_euro2024::text, 9), 16),
    (v_tournament_id, 'NINO',    jsonb_build_object(v_col_sp2022::text, 5,  v_col_euro2024::text, 3), 17),
    (v_tournament_id, 'MAHIR',   jsonb_build_object(v_col_sp2018::text, 8), 18),
    (v_tournament_id, 'BULJINA', jsonb_build_object(v_col_euro2024::text, 5), 19),
    (v_tournament_id, 'MIMKE',   jsonb_build_object(v_col_sp2018::text, 4), 20),
    (v_tournament_id, 'ŠUFTO',   jsonb_build_object(v_col_sp2018::text, 3), 21),
    (v_tournament_id, 'DINO',    jsonb_build_object(v_col_sp2022::text, 3), 22);

  RAISE NOTICE 'Seeded exact eternal table for tournament %', v_tournament_id;
END $$;
