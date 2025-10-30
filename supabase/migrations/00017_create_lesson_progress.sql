-- Create user_lesson_progress table for tracking lesson reading progress
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_seconds INTEGER NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  last_read_position JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMPTZ,
  bookmarked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, domain_id, module_id, lesson_id)
);

-- Add trigger
CREATE TRIGGER update_user_lesson_progress_updated_at
  BEFORE UPDATE ON public.user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX idx_user_lesson_progress_domain_module_lesson ON public.user_lesson_progress(domain_id, module_id, lesson_id);
CREATE INDEX idx_user_lesson_progress_status ON public.user_lesson_progress(status);
CREATE INDEX idx_user_lesson_progress_bookmarked ON public.user_lesson_progress(bookmarked) WHERE bookmarked = true;
CREATE INDEX idx_user_lesson_progress_user_status ON public.user_lesson_progress(user_id, status);

-- Enable RLS
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own lesson progress"
  ON public.user_lesson_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lesson progress"
  ON public.user_lesson_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lesson progress"
  ON public.user_lesson_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lesson progress"
  ON public.user_lesson_progress FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

