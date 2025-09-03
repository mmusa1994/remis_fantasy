-- Add manager_id column to users table for FPL team integration
ALTER TABLE users 
ADD COLUMN manager_id varchar(20);

-- Create index for manager_id lookups
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- Add comment explaining the column
COMMENT ON COLUMN users.manager_id IS 'FPL Manager ID for accessing user team data via API';