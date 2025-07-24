-- Migration to add PayPal as a valid payment method
-- This fixes the constraint violation error when users select PayPal

-- First, drop the existing constraint
ALTER TABLE registration_25_26 DROP CONSTRAINT IF EXISTS registration_25_26_payment_method_check;

-- Add the new constraint that includes 'paypal'
ALTER TABLE registration_25_26 ADD CONSTRAINT registration_25_26_payment_method_check 
CHECK (payment_method IN ('bank', 'wise', 'cash', 'paypal') OR payment_method IS NULL);

-- Update any existing NULL or invalid payment methods if needed
-- This is optional but ensures data consistency
UPDATE registration_25_26 
SET payment_method = 'paypal' 
WHERE payment_method IS NULL AND notes LIKE '%paypal%';