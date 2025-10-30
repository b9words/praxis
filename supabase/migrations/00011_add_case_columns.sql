-- Add missing columns to cases table
ALTER TABLE public.cases 
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Add unique constraint on slug
ALTER TABLE public.cases 
  ADD CONSTRAINT cases_slug_unique UNIQUE (slug);

-- Create index on year and order for sorting
CREATE INDEX IF NOT EXISTS idx_cases_year_order ON public.cases(year, "order");

