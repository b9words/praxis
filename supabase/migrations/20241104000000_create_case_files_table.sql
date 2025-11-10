-- Create case_files table to store case study asset files in DB
CREATE TABLE IF NOT EXISTS public.case_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'text/markdown',
  content TEXT,
  size INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique file_id per case
  UNIQUE(case_id, file_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_case_files_case_id ON public.case_files(case_id);
CREATE INDEX idx_case_files_file_id ON public.case_files(file_id);
CREATE INDEX idx_case_files_case_id_file_id ON public.case_files(case_id, file_id);

-- Add trigger to update updated_at
CREATE TRIGGER update_case_files_updated_at
  BEFORE UPDATE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Update cases table to ensure briefingDoc can be null (for existing cases that might not have it yet)
-- This is a no-op if already nullable, but ensures schema consistency
ALTER TABLE public.cases 
  ALTER COLUMN briefing_doc DROP NOT NULL;






