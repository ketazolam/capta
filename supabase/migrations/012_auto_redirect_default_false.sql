-- Migration 012: Change auto_redirect default to false
-- Auto-redirect never used for template-based pages (casino, etc.)
ALTER TABLE pages ALTER COLUMN auto_redirect SET DEFAULT false;
