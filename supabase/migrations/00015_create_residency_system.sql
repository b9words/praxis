-- Add residency/year tracking to competencies
ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS residency_year INTEGER CHECK (residency_year BETWEEN 1 AND 5);
ALTER TABLE public.competencies ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Add user residency tracking table
CREATE TABLE IF NOT EXISTS public.user_residency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_residency INTEGER NOT NULL DEFAULT 1 CHECK (current_residency BETWEEN 1 AND 5),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add trigger
CREATE TRIGGER update_user_residency_updated_at
  BEFORE UPDATE ON public.user_residency
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.user_residency ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own residency"
  ON public.user_residency FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own residency"
  ON public.user_residency FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own residency"
  ON public.user_residency FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_residency_user_id ON public.user_residency(user_id);

-- Create view for residency progress
CREATE OR REPLACE VIEW user_residency_progress AS
SELECT
  ur.user_id,
  ur.current_residency,
  COUNT(DISTINCT uap.article_id) as articles_completed,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'completed') as simulations_completed,
  (
    SELECT COUNT(*)
    FROM articles a
    JOIN competencies c ON a.competency_id = c.id
    WHERE c.residency_year = ur.current_residency
    AND a.status = 'published'
  ) as total_articles,
  (
    SELECT COUNT(*)
    FROM cases ca
    WHERE ca.status = 'published'
    -- Assume cases are tagged with year through competencies
  ) as total_simulations
FROM user_residency ur
LEFT JOIN user_article_progress uap ON uap.user_id = ur.user_id AND uap.status = 'completed'
LEFT JOIN simulations s ON s.user_id = ur.user_id
GROUP BY ur.user_id, ur.current_residency;

