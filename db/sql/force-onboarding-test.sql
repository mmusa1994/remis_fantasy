-- TEMPORARY: Force onboarding to show for testing
-- Run this to test onboarding modal, then revert afterwards

-- First, make sure the column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_shown BOOLEAN DEFAULT FALSE;

-- Force onboarding to show for your user (replace with your email)
UPDATE users 
SET onboarding_shown = FALSE 
WHERE email = 'YOUR_EMAIL_HERE@gmail.com';

-- Or force ALL users to see onboarding (for testing only!)
-- UPDATE users SET onboarding_shown = FALSE;

-- To check current status:
-- SELECT id, email, onboarding_shown, manager_id FROM users WHERE email = 'YOUR_EMAIL_HERE@gmail.com';