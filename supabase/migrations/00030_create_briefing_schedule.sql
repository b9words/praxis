-- Create briefing_schedule table for managing weekly free content rotation
-- This table stores the schedule of which modules and cases are publicly available each week

CREATE TABLE IF NOT EXISTS public.briefing_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of DATE NOT NULL UNIQUE,
  domain_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient lookups
CREATE INDEX idx_briefing_schedule_week_of ON public.briefing_schedule(week_of DESC);
CREATE INDEX idx_briefing_schedule_domain_module ON public.briefing_schedule(domain_id, module_id);

-- Add comment
COMMENT ON TABLE public.briefing_schedule IS 'Weekly schedule for Intelligence Briefing free content rotation';

-- Enable RLS
ALTER TABLE public.briefing_schedule ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view/edit (will be enforced via application logic)
-- For now, allow service role full access
CREATE POLICY "Service role has full access to briefing_schedule"
  ON public.briefing_schedule
  FOR ALL
  USING (true)
  WITH CHECK (true);


