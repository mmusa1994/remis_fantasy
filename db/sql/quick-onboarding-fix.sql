-- Quick fix for onboarding column - run this in Supabase SQL editor
-- This will solve the 500 error immediately

-- Add the column if it doesn't exist (safe to run multiple times)
DO $$ 
BEGIN 
    -- Add the column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'onboarding_shown'
    ) THEN
        ALTER TABLE users ADD COLUMN onboarding_shown BOOLEAN DEFAULT FALSE;
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_users_onboarding_shown ON users(onboarding_shown);
        
        -- Add comment
        COMMENT ON COLUMN users.onboarding_shown IS 'Tracks if user has completed the onboarding flow';
        
        -- Update existing users (optional - you can skip this)
        UPDATE users SET onboarding_shown = FALSE WHERE onboarding_shown IS NULL;
        
        RAISE NOTICE 'onboarding_shown column added successfully';
    ELSE
        RAISE NOTICE 'onboarding_shown column already exists';
    END IF;
END $$;