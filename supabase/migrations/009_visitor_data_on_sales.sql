-- Migration 009: Add visitor tracking data to sales and events
-- Allows Purchase CAPI to use original visitor fbp/fbc instead of server IP

-- Sales: store visitor data captured at click time
ALTER TABLE sales ADD COLUMN IF NOT EXISTS visitor_fbp text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS visitor_fbc text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS visitor_ip text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS visitor_ua text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS visitor_session_id text;

-- Events: persist fbp/fbc so they can be looked up later for sale attribution
ALTER TABLE events ADD COLUMN IF NOT EXISTS fbp text;
ALTER TABLE events ADD COLUMN IF NOT EXISTS fbc text;
