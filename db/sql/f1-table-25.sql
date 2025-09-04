-- F1 League Table for 2025
CREATE TABLE IF NOT EXISTS public.f1_table_25 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rank integer NOT NULL,
  team_name text NOT NULL,
  manager_name text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  last_rank integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure team names are unique for upserts
CREATE UNIQUE INDEX IF NOT EXISTS ux_f1_table_25_team ON public.f1_table_25(team_name);
CREATE INDEX IF NOT EXISTS ix_f1_table_25_rank ON public.f1_table_25(rank);

-- Enable RLS and simple policies
ALTER TABLE public.f1_table_25 ENABLE ROW LEVEL SECURITY;

-- Read access for everyone (public leaderboard)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'f1_table_25' AND policyname = 'Allow read to all'
  ) THEN
    CREATE POLICY "Allow read to all" ON public.f1_table_25 FOR SELECT USING (true);
  END IF;
END $$;

-- Write access via service role only
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'f1_table_25' AND policyname = 'Service role write'
  ) THEN
    CREATE POLICY "Service role write" ON public.f1_table_25
    FOR INSERT TO authenticated
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'f1_table_25' AND policyname = 'Service role update'
  ) THEN
    CREATE POLICY "Service role update" ON public.f1_table_25
    FOR UPDATE TO authenticated
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END $$;

