-- Migration to add notes field to registration_25_26 table
-- This allows users to add optional notes/comments during registration

-- Add notes column to the registration_25_26 table
ALTER TABLE registration_25_26 
ADD COLUMN notes TEXT;

-- Add comment to document the purpose of the notes field
COMMENT ON COLUMN registration_25_26.notes IS 'Optional notes or comments provided by the user during registration';

-- Create index on notes field for potential search functionality (optional)
-- Uncomment the line below if you plan to search within notes content
-- CREATE INDEX IF NOT EXISTS idx_registration_25_26_notes ON registration_25_26 USING gin(to_tsvector('english', notes));