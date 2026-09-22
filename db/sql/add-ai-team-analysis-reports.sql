-- Čuva zadnje AI izvještaje tima po korisniku, da analiza ne nestane kad se modal zatvori
-- ili stranica osvježi (sedmični limit znači da korisnik ne može ponovo generisati).
-- Pokreni u Supabase SQL editoru. Aplikacija radi i bez ove tabele (fallback na localStorage).

CREATE TABLE IF NOT EXISTS ai_team_analysis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season text NOT NULL,
  target_gw integer NOT NULL,
  model text,
  report jsonb NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_team_analysis_reports_user_created
  ON ai_team_analysis_reports (user_id, created_at DESC);

ALTER TABLE ai_team_analysis_reports ENABLE ROW LEVEL SECURITY;

-- Samo service role (server) piše i čita; klijent ide kroz /api/fpl/ai-team-analysis.
DROP POLICY IF EXISTS "service role full access" ON ai_team_analysis_reports;
CREATE POLICY "service role full access" ON ai_team_analysis_reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE ai_team_analysis_reports IS 'Zadnji AI izvještaji tima (FPL) po korisniku';
