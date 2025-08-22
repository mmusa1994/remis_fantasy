-- Add league_entry_status column to registration_25_26 table
ALTER TABLE registration_25_26 
ADD COLUMN league_entry_status VARCHAR(20) DEFAULT NULL;

-- Valid values: 'entered', 'not_entered', NULL (not set)
-- NULL = not set (no color)
-- 'entered' = green background
-- 'not_entered' = yellow background

-- Add comment to document the column
COMMENT ON COLUMN registration_25_26.league_entry_status IS 'Status of league entry: entered, not_entered, or NULL if not set'; 