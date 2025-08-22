-- Add email tracking fields to registration_25_26 table
-- Run this in Supabase SQL Editor

-- Add new columns for email tracking
ALTER TABLE registration_25_26 
ADD COLUMN IF NOT EXISTS package_type TEXT,
ADD COLUMN IF NOT EXISTS registration_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS codes_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_template_type TEXT,
ADD COLUMN IF NOT EXISTS registration_email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS codes_email_sent_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for package_type
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_package_type_check;
ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_package_type_check 
CHECK (package_type IN ('standard', 'premium', 'standard_h2h', 'premium_h2h') OR package_type IS NULL);

-- Add check constraint for email_template_type
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_email_template_type_check;
ALTER TABLE registration_25_26 
ADD CONSTRAINT registration_25_26_email_template_type_check 
CHECK (email_template_type IN ('standard', 'premium', 'standard_h2h', 'premium_h2h') OR email_template_type IS NULL);

-- Create function to automatically set package_type based on league_type and h2h_league
CREATE OR REPLACE FUNCTION set_package_type()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.league_type = 'premium' AND NEW.h2h_league = TRUE THEN
        NEW.package_type = 'premium_h2h';
    ELSIF NEW.league_type = 'premium' AND NEW.h2h_league = FALSE THEN
        NEW.package_type = 'premium';
    ELSIF NEW.league_type = 'standard' AND NEW.h2h_league = TRUE THEN
        NEW.package_type = 'standard_h2h';
    ELSIF NEW.league_type = 'standard' AND NEW.h2h_league = FALSE THEN
        NEW.package_type = 'standard';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS set_package_type_trigger ON registration_25_26;
CREATE TRIGGER set_package_type_trigger
    BEFORE INSERT OR UPDATE ON registration_25_26
    FOR EACH ROW
    EXECUTE FUNCTION set_package_type();

-- Update existing records to set package_type
UPDATE registration_25_26
SET package_type = CASE
    WHEN league_type = 'premium' AND h2h_league = TRUE THEN 'premium_h2h'
    WHEN league_type = 'premium' AND h2h_league = FALSE THEN 'premium'
    WHEN league_type = 'standard' AND h2h_league = TRUE THEN 'standard_h2h'
    WHEN league_type = 'standard' AND h2h_league = FALSE THEN 'standard'
END
WHERE package_type IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_registration_25_26_package_type ON registration_25_26(package_type);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_registration_email_sent ON registration_25_26(registration_email_sent);
CREATE INDEX IF NOT EXISTS idx_registration_25_26_codes_email_sent ON registration_25_26(codes_email_sent);

-- Verify the new columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'registration_25_26' 
    AND column_name IN ('package_type', 'registration_email_sent', 'codes_email_sent', 
                        'email_template_type', 'registration_email_sent_at', 'codes_email_sent_at')
ORDER BY ordinal_position; 