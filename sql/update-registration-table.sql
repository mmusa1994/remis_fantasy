-- Update registration_25_26 table with missing columns and constraints
-- Run this in Supabase SQL Editor

-- Add missing columns if they don't exist
ALTER TABLE registration_25_26 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS cash_status TEXT,
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS admin_confirmed_by TEXT,
ADD COLUMN IF NOT EXISTS admin_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Drop existing check constraints if they exist
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_payment_method_check;
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_cash_status_check;

-- Add proper check constraints
ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_payment_method_check 
CHECK (payment_method IN ('bank', 'wise', 'cash') OR payment_method IS NULL);

ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_cash_status_check 
CHECK (cash_status IN ('paid', 'pending', 'unpaid', 'confirmed', 'rejected') OR cash_status IS NULL);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS update_registration_25_26_updated_at ON registration_25_26;
CREATE TRIGGER update_registration_25_26_updated_at 
    BEFORE UPDATE ON registration_25_26 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registration_25_26_payment_method ON registration_25_26(payment_method);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_cash_status ON registration_25_26(cash_status);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_h2h_league ON registration_25_26(h2h_league);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_league_type ON registration_25_26(league_type);

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'registration_25_26' 
ORDER BY ordinal_position; 