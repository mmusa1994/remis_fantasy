-- Add unique constraint on IP address to prevent duplicates
-- This will ensure that each IP address can only be tracked once

-- First, remove any existing duplicates (keep only the first occurrence of each IP)
DELETE FROM page_visitors 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM page_visitors 
    GROUP BY ip_address
);

-- Add unique constraint on ip_address column
ALTER TABLE page_visitors ADD CONSTRAINT unique_ip_address UNIQUE (ip_address);

-- Add comment to document the constraint
COMMENT ON CONSTRAINT unique_ip_address ON page_visitors IS 'Ensures each IP address is tracked only once to prevent duplicate visitor entries';
