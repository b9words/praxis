-- Create domain_completions table
CREATE TABLE IF NOT EXISTS public.domain_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  certificate_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, domain_id)
);

CREATE INDEX idx_domain_completions_user_id ON public.domain_completions(user_id);
CREATE INDEX idx_domain_completions_domain_id ON public.domain_completions(domain_id);
CREATE INDEX idx_domain_completions_completed_at ON public.domain_completions(completed_at);

-- Enable RLS
ALTER TABLE public.domain_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own completions
CREATE POLICY "Users can view own domain completions"
  ON public.domain_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own completions (via server actions)
CREATE POLICY "Users can insert own domain completions"
  ON public.domain_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own completions
CREATE POLICY "Users can update own domain completions"
  ON public.domain_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_domain_completions_updated_at
  BEFORE UPDATE ON public.domain_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

