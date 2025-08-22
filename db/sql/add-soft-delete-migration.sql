-- Migration: Add soft delete functionality to registration_25_26 table
-- This adds a deleted_at column to enable soft deletes instead of hard deletes

ALTER TABLE registration_25_26 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL;

-- Add index on deleted_at for better performance when filtering out deleted records
CREATE INDEX idx_registration_25_26_deleted_at ON registration_25_26(deleted_at);

-- Add comment to the column
COMMENT ON COLUMN registration_25_26.deleted_at IS 'Timestamp when the record was soft deleted. NULL means not deleted.';