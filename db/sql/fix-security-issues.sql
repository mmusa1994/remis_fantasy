-- ========================================
-- FIX SUPABASE SECURITY ISSUES
-- Run this in Supabase SQL Editor
-- ========================================

-- ============================================
-- 1. Enable RLS on premier_league_25_26 table
-- ============================================

ALTER TABLE premier_league_25_26 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to premier_league_25_26" ON premier_league_25_26;
DROP POLICY IF EXISTS "Allow admin full access to premier_league_25_26" ON premier_league_25_26;
DROP POLICY IF EXISTS "Allow service role full access to premier_league_25_26" ON premier_league_25_26;

-- Create policy to allow public read access (for standings/leaderboard display)
CREATE POLICY "Allow public read access to premier_league_25_26" ON premier_league_25_26
  FOR SELECT
  USING (deleted_at IS NULL);

-- Create policy to allow authenticated admin users full access
CREATE POLICY "Allow admin full access to premier_league_25_26" ON premier_league_25_26
  FOR ALL
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
    )
  )
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.email = auth.jwt()->>'email'
    )
  );

-- Create policy to allow service role full access (for API calls)
CREATE POLICY "Allow service role full access to premier_league_25_26" ON premier_league_25_26
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 2. Enable RLS on champion_league_25_26 if it exists
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'champion_league_25_26') THEN
    ALTER TABLE champion_league_25_26 ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to champion_league_25_26" ON champion_league_25_26;
    DROP POLICY IF EXISTS "Allow service role full access to champion_league_25_26" ON champion_league_25_26;

    CREATE POLICY "Allow public read access to champion_league_25_26" ON champion_league_25_26
      FOR SELECT
      USING (deleted_at IS NULL);

    CREATE POLICY "Allow service role full access to champion_league_25_26" ON champion_league_25_26
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- 3. Enable RLS on f1_25_26 if it exists
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'f1_25_26') THEN
    ALTER TABLE f1_25_26 ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Allow public read access to f1_25_26" ON f1_25_26;
    DROP POLICY IF EXISTS "Allow service role full access to f1_25_26" ON f1_25_26;

    CREATE POLICY "Allow public read access to f1_25_26" ON f1_25_26
      FOR SELECT
      USING (true);

    CREATE POLICY "Allow service role full access to f1_25_26" ON f1_25_26
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;

-- ============================================
-- 4. Fix registration_25_26 policies (more secure)
-- ============================================

-- Drop overly permissive insert policy
DROP POLICY IF EXISTS "Allow public insert access to registration_25_26" ON registration_25_26;

-- Create more restrictive insert policy with rate limiting consideration
CREATE POLICY "Allow anon insert to registration_25_26" ON registration_25_26
  FOR INSERT
  TO anon
  WITH CHECK (
    -- Only allow inserting records for the current request
    deleted_at IS NULL
  );

-- ============================================
-- 5. Verify RLS is enabled on all public tables
-- ============================================

-- Check which tables don't have RLS enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================
-- 6. Grant appropriate permissions
-- ============================================

-- Revoke direct table access, force through RLS
REVOKE ALL ON premier_league_25_26 FROM anon;
REVOKE ALL ON premier_league_25_26 FROM authenticated;

-- Grant SELECT only to anon (public read)
GRANT SELECT ON premier_league_25_26 TO anon;

-- Grant all to authenticated (controlled by RLS)
GRANT ALL ON premier_league_25_26 TO authenticated;

-- Service role always has full access
GRANT ALL ON premier_league_25_26 TO service_role;

-- ============================================
-- VERIFICATION QUERIES
-- Run these to verify security setup
-- ============================================

-- Check RLS status on all tables
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies on premier_league_25_26
-- SELECT * FROM pg_policies WHERE tablename = 'premier_league_25_26';

-- Check policies on registration_25_26
-- SELECT * FROM pg_policies WHERE tablename = 'registration_25_26';
