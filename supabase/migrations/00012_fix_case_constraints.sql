-- Make rubric column nullable since we store everything in briefing_doc
ALTER TABLE public.cases 
  ALTER COLUMN rubric DROP NOT NULL;

-- Make datasets nullable too (already should be, but ensure it)
ALTER TABLE public.cases 
  ALTER COLUMN datasets DROP NOT NULL;

