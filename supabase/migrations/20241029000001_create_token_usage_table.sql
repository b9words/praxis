-- Create token usage tracking table
CREATE TABLE IF NOT EXISTS public.token_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_token_usage_date_model ON public.token_usage(date, model);
CREATE INDEX IF NOT EXISTS idx_token_usage_created_at ON public.token_usage(created_at);

-- Enable RLS
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all operations for service role and authenticated users)
CREATE POLICY "Token usage is viewable by all"
  ON public.token_usage FOR SELECT
  USING (true);

CREATE POLICY "Token usage is insertable by all"
  ON public.token_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Token usage is updatable by all"
  ON public.token_usage FOR UPDATE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_token_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_token_usage_updated_at
  BEFORE UPDATE ON public.token_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_token_usage_updated_at();
