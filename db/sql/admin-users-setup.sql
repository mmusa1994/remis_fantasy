-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for admin table (only accessible via service role)
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;

-- Muhamed Musa admin user
-- Password: Muhamed9!
INSERT INTO admin_users (email, password_hash, name) VALUES (
  'muhko25@gmail.com',
  '$2b$10$FTUdkd2x6NmuNfBL2sKPCewBoXmsuBrrTIqKqF10RMNdk64q1GMNG',
  'Muhamed Musa'
) ON CONFLICT (email) DO NOTHING;

 