-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to get user's aggregate scores across all completed simulations
CREATE OR REPLACE FUNCTION public.get_user_aggregate_scores(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'financialAcumen', COALESCE(AVG((d.radar_chart_data->>'financialAcumen')::numeric), 0),
    'strategicThinking', COALESCE(AVG((d.radar_chart_data->>'strategicThinking')::numeric), 0),
    'marketAwareness', COALESCE(AVG((d.radar_chart_data->>'marketAwareness')::numeric), 0),
    'riskManagement', COALESCE(AVG((d.radar_chart_data->>'riskManagement')::numeric), 0),
    'leadershipJudgment', COALESCE(AVG((d.radar_chart_data->>'leadershipJudgment')::numeric), 0)
  )
  INTO result
  FROM public.debriefs d
  JOIN public.simulations s ON d.simulation_id = s.id
  WHERE s.user_id = user_uuid
    AND s.status = 'completed';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recommended next simulation for a user
CREATE OR REPLACE FUNCTION public.get_recommended_simulation(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  completed_case_ids UUID[];
  recommended_case_id UUID;
BEGIN
  -- Get all completed case IDs for the user
  SELECT ARRAY_AGG(case_id) INTO completed_case_ids
  FROM public.simulations
  WHERE user_id = user_uuid AND status = 'completed';
  
  -- Get the first published case not yet completed
  SELECT id INTO recommended_case_id
  FROM public.cases
  WHERE status = 'published'
    AND (completed_case_ids IS NULL OR id != ALL(completed_case_ids))
  ORDER BY created_at ASC
  LIMIT 1;
  
  RETURN recommended_case_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;



