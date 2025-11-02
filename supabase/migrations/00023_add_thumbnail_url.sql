-- Migration: Add thumbnail_url columns to articles and cases tables
-- This enables storing generated thumbnail image URLs for Open Graph images

-- Add thumbnail_url to articles table
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add thumbnail_url to cases table
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Add indexes for fast lookups by thumbnail_url (optional, but useful for queries)
CREATE INDEX IF NOT EXISTS idx_articles_thumbnail_url ON public.articles(thumbnail_url) WHERE thumbnail_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cases_thumbnail_url ON public.cases(thumbnail_url) WHERE thumbnail_url IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN public.articles.thumbnail_url IS 'URL to the generated thumbnail image (1200x630px) for Open Graph and social sharing';
COMMENT ON COLUMN public.cases.thumbnail_url IS 'URL to the generated thumbnail image (1200x630px) for Open Graph and social sharing';

