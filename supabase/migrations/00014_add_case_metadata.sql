-- Add metadata columns to cases table for better UX
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS prerequisites JSONB DEFAULT '[]'::jsonb;

-- Add default values for existing rows
UPDATE public.cases SET difficulty = 'intermediate' WHERE difficulty IS NULL;
UPDATE public.cases SET estimated_minutes = 45 WHERE estimated_minutes IS NULL;

