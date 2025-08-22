-- Enable Row Level Security on registration_25_26 table
ALTER TABLE registration_25_26 ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to registration_25_26" ON registration_25_26;
DROP POLICY IF EXISTS "Allow public insert access to registration_25_26" ON registration_25_26;
DROP POLICY IF EXISTS "Allow admin full access to registration_25_26" ON registration_25_26;

-- Create policy to allow public registration (INSERT only)
CREATE POLICY "Allow public insert access to registration_25_26" ON registration_25_26
  FOR INSERT WITH CHECK (true);

-- Create policy to allow admin users full access (SELECT, UPDATE, DELETE)
-- This will be enforced by the server-side API routes that verify admin sessions
CREATE POLICY "Allow admin full access to registration_25_26" ON registration_25_26
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
    )
  );

-- Create policy to allow users to read their own registration (for confirmation pages)
CREATE POLICY "Allow users to read own registration" ON registration_25_26
  FOR SELECT USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Create policy to allow users to update their own registration (for profile updates)
CREATE POLICY "Allow users to update own registration" ON registration_25_26
  FOR UPDATE USING (
    email = current_setting('request.jwt.claims', true)::json->>'email'
  );

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_registration_25_26_email ON registration_25_26(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_registration_25_26_created_at ON registration_25_26(created_at DESC);

-- Create index on deleted_at for soft delete queries
CREATE INDEX IF NOT EXISTS idx_registration_25_26_deleted_at ON registration_25_26(deleted_at);
