-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_competencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debriefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Competencies policies (read-only for all authenticated users)
CREATE POLICY "Competencies are viewable by authenticated users" 
  ON public.competencies FOR SELECT 
  TO authenticated 
  USING (true);

-- Articles policies
CREATE POLICY "Published articles are viewable by authenticated users" 
  ON public.articles FOR SELECT 
  TO authenticated 
  USING (status = 'published');

CREATE POLICY "Editors can view all articles" 
  ON public.articles FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can insert articles" 
  ON public.articles FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can update articles" 
  ON public.articles FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

-- Cases policies
CREATE POLICY "Published cases are viewable by authenticated users" 
  ON public.cases FOR SELECT 
  TO authenticated 
  USING (status = 'published');

CREATE POLICY "Editors can view all cases" 
  ON public.cases FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can insert cases" 
  ON public.cases FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Editors can update cases" 
  ON public.cases FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role IN ('editor', 'admin')
    )
  );

-- Case competencies policies
CREATE POLICY "Case competencies are viewable by authenticated users" 
  ON public.case_competencies FOR SELECT 
  TO authenticated 
  USING (true);

-- Simulations policies
CREATE POLICY "Users can view own simulations" 
  ON public.simulations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own simulations" 
  ON public.simulations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own simulations" 
  ON public.simulations FOR UPDATE 
  USING (auth.uid() = user_id);

-- Debriefs policies
CREATE POLICY "Users can view own debriefs" 
  ON public.debriefs FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.simulations 
      WHERE simulations.id = debriefs.simulation_id 
      AND simulations.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert debriefs" 
  ON public.debriefs FOR INSERT 
  WITH CHECK (true);

-- Forum channels policies (public read, admin write)
CREATE POLICY "Channels are viewable by authenticated users" 
  ON public.forum_channels FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage channels" 
  ON public.forum_channels FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Forum threads policies
CREATE POLICY "Threads are viewable by authenticated users" 
  ON public.forum_threads FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create threads" 
  ON public.forum_threads FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own threads" 
  ON public.forum_threads FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = author_id);

-- Forum posts policies
CREATE POLICY "Posts are viewable by authenticated users" 
  ON public.forum_posts FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create posts" 
  ON public.forum_posts FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update own posts" 
  ON public.forum_posts FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = author_id);



