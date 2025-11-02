-- Create learning_paths table
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learning_paths_slug ON public.learning_paths(slug);
CREATE INDEX idx_learning_paths_status ON public.learning_paths(status);
CREATE INDEX idx_learning_paths_created_at ON public.learning_paths(created_at);

-- Create learning_path_items table
CREATE TABLE IF NOT EXISTS public.learning_path_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  order INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lesson', 'case')),
  domain TEXT,
  module TEXT,
  lesson TEXT,
  case_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_learning_path_items_path_id ON public.learning_path_items(path_id);
CREATE INDEX idx_learning_path_items_path_order ON public.learning_path_items(path_id, order);

-- Enable RLS
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_paths
-- Anyone can view published paths
CREATE POLICY "Published learning paths are viewable by all authenticated users"
  ON public.learning_paths FOR SELECT
  TO authenticated
  USING (status = 'published');

-- Only editors and admins can view draft paths
CREATE POLICY "Editors and admins can view draft learning paths"
  ON public.learning_paths FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('editor', 'admin')
    )
  );

-- Only editors and admins can create/update/delete paths
CREATE POLICY "Editors and admins can manage learning paths"
  ON public.learning_paths FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('editor', 'admin')
    )
  );

-- RLS Policies for learning_path_items
-- Anyone can view items for published paths
CREATE POLICY "Items for published paths are viewable by all authenticated users"
  ON public.learning_path_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.learning_paths
      WHERE id = path_id
      AND status = 'published'
    )
  );

-- Editors and admins can view items for draft paths
CREATE POLICY "Editors and admins can view items for draft paths"
  ON public.learning_path_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('editor', 'admin')
    )
  );

-- Only editors and admins can create/update/delete items
CREATE POLICY "Editors and admins can manage learning path items"
  ON public.learning_path_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('editor', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('editor', 'admin')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_learning_paths_updated_at
  BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_learning_path_items_updated_at
  BEFORE UPDATE ON public.learning_path_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

