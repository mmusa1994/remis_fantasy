-- Fix RLS policies for user_ai_usage table to allow INSERT and UPDATE operations
-- Run this in your Supabase SQL editor

-- OPTION 1: Add specific INSERT/UPDATE policies (try this first)
CREATE POLICY "Users can insert own AI usage" ON user_ai_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Users can update own AI usage" ON user_ai_usage
    FOR UPDATE USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- OPTION 2: If Option 1 doesn't work, use service role policy instead
-- First remove existing policies:
-- DROP POLICY IF EXISTS "Users can view own AI usage" ON user_ai_usage;
-- DROP POLICY IF EXISTS "Users can insert own AI usage" ON user_ai_usage; 
-- DROP POLICY IF EXISTS "Users can update own AI usage" ON user_ai_usage;

-- Then create service role policy:
-- CREATE POLICY "Service can manage AI usage" ON user_ai_usage
--     FOR ALL USING (auth.role() = 'service_role' OR auth.uid() = user_id);

-- OPTION 3: Nuclear option - disable RLS completely (least secure)
-- ALTER TABLE user_ai_usage DISABLE ROW LEVEL SECURITY;