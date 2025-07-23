-- Create the registrations table for 2025/26 season
CREATE TABLE IF NOT EXISTS registration_25_26 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  team_name TEXT NOT NULL,
  league_type TEXT NOT NULL CHECK (league_type IN ('standard', 'premium')),
  h2h_league BOOLEAN DEFAULT FALSE,
  payment_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DISABLE Row Level Security temporarily for easier registration
ALTER TABLE registration_25_26 DISABLE ROW LEVEL SECURITY;

-- Alternative: If you want to keep RLS enabled, use these policies instead:
-- ALTER TABLE registration_25_26 ENABLE ROW LEVEL SECURITY;

-- Create policy to allow reading all registrations (for admin purposes)
-- CREATE POLICY "Allow read access to registration_25_26" ON registration_25_26
--   FOR SELECT USING (true);

-- Create policy to allow ALL users to insert registrations (public registration form)
-- CREATE POLICY "Allow public insert access to registration_25_26" ON registration_25_26
--   FOR INSERT WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_registration_25_26_email ON registration_25_26(email);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_registration_25_26_created_at ON registration_25_26(created_at DESC);

-- Create Storage bucket for payment proofs (run this in Supabase Storage section manually)
-- Bucket name: payment-proofs
-- Public: false (private)

-- Create RLS policies for storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', false)
ON CONFLICT DO NOTHING;

-- Allow anonymous and authenticated users to upload files
CREATE POLICY "Allow upload payment proofs" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'payment-proofs');

-- Allow reading files (for admin purposes)
CREATE POLICY "Allow read payment proofs" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'payment-proofs');