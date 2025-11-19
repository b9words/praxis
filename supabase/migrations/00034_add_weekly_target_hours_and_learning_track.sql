-- Add weekly_target_hours and learning_track columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS weekly_target_hours integer,
ADD COLUMN IF NOT EXISTS learning_track text;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.weekly_target_hours IS 'User''s weekly time commitment goal in hours (1-10)';
COMMENT ON COLUMN public.profiles.learning_track IS 'User''s selected learning track (e.g., "Prepare for Management", "Master Corporate Strategy", "Think Like an Investor")';


