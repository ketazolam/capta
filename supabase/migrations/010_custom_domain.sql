-- Migration 010: Custom domain per page
-- Allows serving a smart link from a client-owned domain (e.g. palace-casino.com.ar)

ALTER TABLE pages ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_pages_custom_domain ON pages(custom_domain) WHERE custom_domain IS NOT NULL;
