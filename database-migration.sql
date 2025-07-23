-- Migration script to add email uniqueness constraint to existing table
-- Run this in your Supabase SQL editor

-- First, remove any duplicate emails if they exist
WITH duplicate_emails AS (
  SELECT email, MIN(created_at) as first_created
  FROM registration_25_26
  GROUP BY email
  HAVING COUNT(*) > 1
)
DELETE FROM registration_25_26 
WHERE email IN (SELECT email FROM duplicate_emails)
  AND created_at NOT IN (SELECT first_created FROM duplicate_emails);

-- Now add the unique constraint
ALTER TABLE registration_25_26 
ADD CONSTRAINT email_unique_constraint UNIQUE (email);