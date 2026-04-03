-- Fase 2.5 bugfixes: 3 RPCs para resolver race conditions y truncamiento silencioso

-- RPC 1: Atomic contact purchase upsert
-- Resuelve: race condition read-then-write, contact no existe, code duplication
CREATE OR REPLACE FUNCTION increment_contact_purchase(
  p_project_id uuid,
  p_phone text,
  p_amount numeric DEFAULT 0
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO contacts (project_id, phone, purchase_count, total_purchases, last_seen_at)
  VALUES (p_project_id, p_phone, 1, p_amount, now())
  ON CONFLICT (project_id, phone)
  DO UPDATE SET
    purchase_count   = contacts.purchase_count + 1,
    total_purchases  = contacts.total_purchases + EXCLUDED.total_purchases,
    last_seen_at     = now();
$$;

-- RPC 2: Pre-aggregated analytics summary (no 1000-row truncation)
-- Resuelve: query truncada a 1000 filas, UTC timezone mismatch
CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_project_id uuid,
  p_since timestamptz
)
RETURNS TABLE (
  event_type  text,
  event_date  date,
  event_count int
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    event_type,
    (date_trunc('day', created_at AT TIME ZONE 'UTC'))::date AS event_date,
    count(*)::int AS event_count
  FROM events
  WHERE project_id = p_project_id
    AND created_at >= p_since
  GROUP BY event_type, event_date
  ORDER BY event_date;
$$;

-- RPC 3: Line usage counts for round-robin (no 1000-row truncation)
-- Resuelve: query sin limite en smart-link page
CREATE OR REPLACE FUNCTION get_line_usage_counts(
  p_project_id uuid
)
RETURNS TABLE (
  line_id     uuid,
  usage_count int
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    line_id,
    count(*)::int AS usage_count
  FROM events
  WHERE project_id = p_project_id
    AND event_type = 'conversation_start'
    AND line_id IS NOT NULL
  GROUP BY line_id;
$$;
