-- Create debriefs table
CREATE TABLE IF NOT EXISTS public.debriefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID UNIQUE NOT NULL REFERENCES public.simulations(id) ON DELETE CASCADE,
  scores JSONB NOT NULL,
  summary_text TEXT NOT NULL,
  radar_chart_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger to debriefs
CREATE TRIGGER update_debriefs_updated_at
  BEFORE UPDATE ON public.debriefs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_debriefs_simulation_id ON public.debriefs(simulation_id);



