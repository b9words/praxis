-- Archive Community, Applications, and Moderation Features
-- Drop tables related to archived features

-- Drop forum tables (community features)
DROP TABLE IF EXISTS forum_posts CASCADE;
DROP TABLE IF EXISTS forum_threads CASCADE;
DROP TABLE IF EXISTS forum_channels CASCADE;

-- Drop applications table
DROP TABLE IF EXISTS user_applications CASCADE;

-- Drop moderation/reports table
DROP TABLE IF EXISTS reports CASCADE;

