-- Migration 003: Add attribution_config to projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS attribution_config jsonb
DEFAULT '{"meta":{"page_view":true,"button_click":true,"conversation_start":true,"purchase":true},"tiktok":{"page_view":true,"button_click":true,"conversation_start":true,"purchase":true}}'::jsonb;
