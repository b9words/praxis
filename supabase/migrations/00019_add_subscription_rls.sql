-- Add subscription-based RLS policies for premium content access
-- This migration adds policies to check subscription status when accessing premium content

-- Enable RLS on subscriptions table if not already enabled
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Subscription policies (users can view their own subscription)
CREATE POLICY "Users can view own subscription" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

-- Add helper function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.user_has_active_subscription(user_id_param UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.subscriptions 
    WHERE user_id = user_id_param 
    AND status = 'active'
    AND current_period_end > NOW()
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Add premium content flag to articles (optional metadata field, can use tags/metadata JSON instead)
-- We'll use metadata JSON field for now, so no schema change needed

-- Enhanced articles policy: Allow premium content only for active subscribers
-- This policy extends the existing published articles policy
-- Note: All existing published articles are accessible. Premium articles should be marked in metadata
DROP POLICY IF EXISTS "Published articles are viewable by authenticated users" ON public.articles;

CREATE POLICY "Published articles are viewable by authenticated users" 
  ON public.articles FOR SELECT 
  TO authenticated 
  USING (
    status = 'published' AND (
      -- Free content (metadata doesn't indicate premium, or isPremium is false/null)
      (metadata->>'isPremium')::boolean IS NOT TRUE
      OR
      -- Premium content accessible to subscribers
      (
        (metadata->>'isPremium')::boolean IS TRUE
        AND public.user_has_active_subscription(auth.uid())
      )
      OR
      -- Editors/admins can see all
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('editor', 'admin')
      )
    )
  );

-- Enhanced cases policy: Allow premium cases only for active subscribers
DROP POLICY IF EXISTS "Published cases are viewable by authenticated users" ON public.cases;

CREATE POLICY "Published cases are viewable by authenticated users" 
  ON public.cases FOR SELECT 
  TO authenticated 
  USING (
    status = 'published' AND (
      -- Free content
      (metadata->>'isPremium')::boolean IS NOT TRUE
      OR
      -- Premium content accessible to subscribers
      (
        (metadata->>'isPremium')::boolean IS TRUE
        AND public.user_has_active_subscription(auth.uid())
      )
      OR
      -- Editors/admins can see all
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role IN ('editor', 'admin')
      )
    )
  );

-- Add RLS policies for new tables (UserApplication and Notification)
ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- UserApplication policies
CREATE POLICY "Users can view own application" 
  ON public.user_applications FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create applications" 
  ON public.user_applications FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Admins can view all applications (via existing role check in app code, but add RLS too)
CREATE POLICY "Admins can view all applications" 
  ON public.user_applications FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Admins can update applications" 
  ON public.user_applications FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'editor')
    )
  );

-- Notification policies
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

-- System can create notifications (for server-side triggers)
CREATE POLICY "System can create notifications" 
  ON public.notifications FOR INSERT 
  WITH CHECK (true);

-- Add index for subscription status checks
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status_active 
  ON public.subscriptions(user_id, status) 
  WHERE status = 'active' AND current_period_end > NOW();

