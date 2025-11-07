-- Add focus_competency column to user_residency table
-- This stores the domain ID chosen during onboarding to override first dashboard recommendation

ALTER TABLE public.user_residency
  ADD COLUMN IF NOT EXISTS focus_competency TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_user_residency_focus_competency
  ON public.user_residency(focus_competency);


