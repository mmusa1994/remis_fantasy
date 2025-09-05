-- Enable manager_id updates for users
-- This script ensures that users can update their manager_id field

-- First, check if there are any restrictions on the manager_id column
-- and ensure the column allows updates

-- Update the existing RLS policy to allow manager_id updates
-- The existing policy "Users can update own profile" should already cover this,
-- but we'll make it explicit

-- Drop the existing update policy if it exists and recreate it
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can update own manager_id" ON users;

-- Create a simple update policy that allows all profile updates
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Ensure the manager_id column doesn't have any constraints preventing updates
-- (This is mainly for documentation - the column should already be updatable)

-- Test update query example:
-- UPDATE users 
-- SET manager_id = 'NEW_MANAGER_ID', 
--     manager_id_verified = NULL,
--     manager_id_verification_note = 'Updated by user',
--     updated_at = now()
-- WHERE id = auth.uid();

-- Grant UPDATE permissions to authenticated users
GRANT UPDATE (manager_id, manager_id_verified, manager_id_verification_note, updated_at) 
ON users TO authenticated;

COMMENT ON COLUMN users.manager_id IS 'FPL Manager ID - can be updated by user to correct mistakes';