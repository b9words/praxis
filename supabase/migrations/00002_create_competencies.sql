-- Create competencies table for hierarchical competency framework
CREATE TABLE IF NOT EXISTS public.competencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.competencies(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('domain', 'competency', 'micro_skill')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger to competencies
CREATE TRIGGER update_competencies_updated_at
  BEFORE UPDATE ON public.competencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_competencies_parent_id ON public.competencies(parent_id);
CREATE INDEX idx_competencies_level ON public.competencies(level);



