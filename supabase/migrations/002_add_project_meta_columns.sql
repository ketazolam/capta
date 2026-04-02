-- Add Meta pixel columns to projects table (missing from 001)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_pixel_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_access_token text;

-- Add unique constraint on pages.slug globally (smart links need globally unique slugs)
-- First drop the existing project_id+slug unique if it exists, then add global unique
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pages_slug_global_unique'
  ) THEN
    ALTER TABLE pages ADD CONSTRAINT pages_slug_global_unique UNIQUE (slug);
  END IF;
END $$;
