-- Migration 007: External pages support
-- Adds page_type, external_url, and tracking_id to the pages table

ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS page_type text NOT NULL DEFAULT 'internal',
  ADD COLUMN IF NOT EXISTS external_url text,
  ADD COLUMN IF NOT EXISTS tracking_id text;

-- Unique constraint on tracking_id (nullable, so use partial index)
CREATE UNIQUE INDEX IF NOT EXISTS pages_tracking_id_unique
  ON pages (tracking_id)
  WHERE tracking_id IS NOT NULL;

-- Optional: attribute sales to a specific page (for analytics attribution)
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS page_id uuid REFERENCES pages(id) ON DELETE SET NULL;
