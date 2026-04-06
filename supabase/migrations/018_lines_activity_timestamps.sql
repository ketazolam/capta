-- Track bot liveness: last heartbeat ping and last real inbound message
-- These are updated by capta-baileys (Railway) and displayed in the LineCard
ALTER TABLE lines ADD COLUMN IF NOT EXISTS last_ping_at timestamptz;
ALTER TABLE lines ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
