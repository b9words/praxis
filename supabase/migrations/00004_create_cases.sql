-- Create cases table for business simulations
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  briefing_doc TEXT NOT NULL,
  datasets JSONB,
  rubric JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'approved', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES public.profiles(id),
  updated_by UUID REFERENCES public.profiles(id)
);

-- Create junction table for cases and competencies (many-to-many)
CREATE TABLE IF NOT EXISTS public.case_competencies (
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  competency_id UUID NOT NULL REFERENCES public.competencies(id) ON DELETE CASCADE,
  PRIMARY KEY (case_id, competency_id)
);

-- Add trigger to cases
CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_created_by ON public.cases(created_by);
CREATE INDEX idx_case_competencies_case_id ON public.case_competencies(case_id);
CREATE INDEX idx_case_competencies_competency_id ON public.case_competencies(competency_id);



