-- Migration: Add storage support for hybrid architecture
-- This enables files to be stored in Supabase Storage with metadata cached in Postgres

-- Alter articles table to support storage-based architecture
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ALTER COLUMN content DROP NOT NULL;

-- Alter cases table to support storage-based architecture
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ALTER COLUMN briefing_doc DROP NOT NULL;

-- Add indexes for fast lookups by storage_path
CREATE INDEX IF NOT EXISTS idx_articles_storage_path ON public.articles(storage_path);
CREATE INDEX IF NOT EXISTS idx_cases_storage_path ON public.cases(storage_path);

-- Add unique constraint on storage_path where not null
-- This ensures each file maps to exactly one database record
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_storage_path_unique 
  ON public.articles(storage_path) 
  WHERE storage_path IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cases_storage_path_unique 
  ON public.cases(storage_path) 
  WHERE storage_path IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN public.articles.storage_path IS 'Path to the file in Supabase Storage (e.g., articles/year1/domain/module/lesson.md)';
COMMENT ON COLUMN public.articles.metadata IS 'JSONB field storing frontmatter metadata: duration, difficulty, domain, module, lesson_number, etc.';
COMMENT ON COLUMN public.cases.storage_path IS 'Path to the JSON file in Supabase Storage (e.g., cases/year1/case-name.json)';
COMMENT ON COLUMN public.cases.metadata IS 'JSONB field storing case metadata: difficulty, duration, competencies, etc.';

