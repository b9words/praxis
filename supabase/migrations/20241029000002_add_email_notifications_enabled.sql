-- Add email_notifications_enabled column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT true;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications_enabled 
ON public.profiles(email_notifications_enabled);

