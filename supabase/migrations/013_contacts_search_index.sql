-- Migration 013: GIN trigram index on contacts for ILIKE search
-- Required for fast phone/name search in contactos page (avoids full table scan)

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_contacts_phone_trgm
  ON contacts USING GIN (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
  ON contacts USING GIN (name gin_trgm_ops);
