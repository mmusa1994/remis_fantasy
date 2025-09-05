-- Create the Champions League registrations table for 2025/26 season
CREATE TABLE IF NOT EXISTS cl_registrations_25_26 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank', 'wise', 'cash', 'paypal')),
  payment_proof_url TEXT,
  payment_status TEXT CHECK (payment_status IN ('paid', 'pending')) DEFAULT 'pending',
  admin_notes TEXT,
  admin_confirmed_by TEXT,
  admin_confirmed_at TIMESTAMP WITH TIME ZONE,
  registration_email_sent BOOLEAN DEFAULT FALSE,
  codes_email_sent BOOLEAN DEFAULT FALSE,
  codes_email_sent_at TIMESTAMP WITH TIME ZONE,
  email_template_type TEXT,
  league_entry_status TEXT CHECK (league_entry_status IN ('entered', 'not_entered')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- DISABLE Row Level Security for easier registration
ALTER TABLE cl_registrations_25_26 DISABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cl_registrations_25_26_email ON cl_registrations_25_26(email);
CREATE INDEX IF NOT EXISTS idx_cl_registrations_25_26_created_at ON cl_registrations_25_26(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cl_registrations_25_26_payment_status ON cl_registrations_25_26(payment_status);
CREATE INDEX IF NOT EXISTS idx_cl_registrations_25_26_codes_email_sent ON cl_registrations_25_26(codes_email_sent);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_cl_registrations_25_26_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cl_registrations_25_26_updated_at_trigger
  BEFORE UPDATE ON cl_registrations_25_26
  FOR EACH ROW
  EXECUTE FUNCTION update_cl_registrations_25_26_updated_at();

-- Insert sample data for testing (comment out for production)
-- INSERT INTO cl_registrations_25_26 (
--   first_name, 
--   last_name, 
--   email, 
--   phone, 
--   payment_method, 
--   payment_status,
--   notes
-- ) VALUES 
-- ('John', 'Doe', 'john.doe@example.com', '+387 62 123 456', 'paypal', 'paid', 'Test registration for Champions League'),
-- ('Jane', 'Smith', 'jane.smith@example.com', '+387 62 789 012', 'bank', 'pending', 'Another test registration');