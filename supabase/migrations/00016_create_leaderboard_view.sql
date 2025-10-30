-- Create leaderboard view for rankings
CREATE OR REPLACE VIEW public.user_leaderboard AS
SELECT 
  p.id,
  p.username,
  p.full_name,
  p.avatar_url,
  COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS simulations_completed,
  COUNT(DISTINCT CASE WHEN uap.status = 'completed' THEN uap.article_id END) AS articles_completed,
  COALESCE(AVG(
    (d.scores::jsonb -> 0 ->> 'score')::numeric
  ), 0) AS average_score,
  MAX(s.completed_at) AS last_activity
FROM public.profiles p
LEFT JOIN public.simulations s ON p.id = s.user_id
LEFT JOIN public.debriefs d ON s.id = d.simulation_id
LEFT JOIN public.user_article_progress uap ON p.id = uap.user_id
WHERE p.username IS NOT NULL
GROUP BY p.id, p.username, p.full_name, p.avatar_url;

-- Note: RLS policies cannot be applied to views
-- Access control is handled at the application level

-- Create function to get top performers for a specific simulation
CREATE OR REPLACE FUNCTION public.get_simulation_leaderboard(case_uuid UUID, limit_count INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  average_score NUMERIC,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS user_id,
    p.username,
    p.full_name,
    p.avatar_url,
    COALESCE(AVG(
      (d.scores::jsonb -> 0 ->> 'score')::numeric
    ), 0) AS average_score,
    MAX(s.completed_at) AS completed_at
  FROM public.profiles p
  INNER JOIN public.simulations s ON p.id = s.user_id
  INNER JOIN public.debriefs d ON s.id = d.simulation_id
  WHERE s.case_id = case_uuid
    AND s.status = 'completed'
    AND p.username IS NOT NULL
  GROUP BY p.id, p.username, p.full_name, p.avatar_url
  ORDER BY average_score DESC, completed_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
