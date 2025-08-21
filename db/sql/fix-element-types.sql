-- Add missing columns to fpl_element_types table
ALTER TABLE public.fpl_element_types 
ADD COLUMN IF NOT EXISTS squad_select INTEGER,
ADD COLUMN IF NOT EXISTS squad_min_select INTEGER,
ADD COLUMN IF NOT EXISTS squad_max_select INTEGER,
ADD COLUMN IF NOT EXISTS squad_min_play INTEGER,
ADD COLUMN IF NOT EXISTS squad_max_play INTEGER,
ADD COLUMN IF NOT EXISTS ui_shirt_specific BOOLEAN,
ADD COLUMN IF NOT EXISTS sub_positions_locked INTEGER[],
ADD COLUMN IF NOT EXISTS element_count INTEGER;

-- Verify the update
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fpl_element_types' 
  AND table_schema = 'public'
ORDER BY ordinal_position;