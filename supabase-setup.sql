-- Create the registrations table
CREATE TABLE IF NOT EXISTS registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  league_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading all registrations (for admin purposes)
CREATE POLICY "Allow read access to registrations" ON registrations
  FOR SELECT USING (true);

-- Create policy to allow inserting new registrations
CREATE POLICY "Allow insert access to registrations" ON registrations
  FOR INSERT WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_registrations_created_at ON registrations(created_at DESC);