-- Add new columns for active/bench points separation
ALTER TABLE public.fpl_manager_metrics 
ADD COLUMN IF NOT EXISTS active_points_no_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS active_points_final INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bench_points_no_bonus INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bench_points_final INTEGER DEFAULT 0;

-- Verify the new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'fpl_manager_metrics' 
  AND table_schema = 'public'
  AND column_name LIKE '%points%'
ORDER BY ordinal_position;