-- Migration 011: Preferred line per page
-- Allows pinning a specific WhatsApp line to a page.
-- If the preferred line is down, the smart link falls back to round-robin.

ALTER TABLE pages ADD COLUMN IF NOT EXISTS preferred_line_id UUID REFERENCES lines(id) ON DELETE SET NULL;
