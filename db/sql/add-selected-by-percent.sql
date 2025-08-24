-- Add selected_by_percent column to fpl_players table
-- This column stores the ownership percentage as a string (e.g., "45.2")

ALTER TABLE public.fpl_players 
ADD COLUMN IF NOT EXISTS selected_by_percent TEXT DEFAULT '0';

-- Create index for better performance when querying by ownership
CREATE INDEX IF NOT EXISTS idx_fpl_players_selected_by_percent 
ON public.fpl_players(selected_by_percent);

-- Update existing players with default value if needed
UPDATE public.fpl_players 
SET selected_by_percent = '0' 
WHERE selected_by_percent IS NULL;