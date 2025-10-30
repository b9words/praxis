-- Create user_article_progress table for tracking reading progress
CREATE TABLE IF NOT EXISTS public.user_article_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, article_id)
);

-- Add trigger
CREATE TRIGGER update_user_article_progress_updated_at
  BEFORE UPDATE ON public.user_article_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_user_article_progress_user_id ON public.user_article_progress(user_id);
CREATE INDEX idx_user_article_progress_article_id ON public.user_article_progress(article_id);
CREATE INDEX idx_user_article_progress_status ON public.user_article_progress(status);

-- Enable RLS
ALTER TABLE public.user_article_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own progress"
  ON public.user_article_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON public.user_article_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON public.user_article_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
  ON public.user_article_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

