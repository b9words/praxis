-- Add Capital Allocation competency for the new curriculum
INSERT INTO competencies (id, name, description, level, parent_id, residency_year, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'Capital Allocation Mastery',
  'Master the art and science of capital allocation - the CEO''s most critical skill. Learn to make optimal decisions about reinvestment, acquisitions, debt, dividends, and buybacks to maximize long-term per-share value.',
  'domain',
  NULL,
  4,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM competencies WHERE name = 'Capital Allocation Mastery'
);

-- Get the ID of the Capital Allocation competency for reference
-- This will be used by the content generator to associate lessons with the right competency
