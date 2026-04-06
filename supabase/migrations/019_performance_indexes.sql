-- Migration 019: Performance indexes for events, sales, and contacts
-- Without these, analytics and attribution queries do full table scans

-- Events: analytics queries filter by project_id + date range
CREATE INDEX IF NOT EXISTS idx_events_project_created
  ON events (project_id, created_at DESC);

-- Events: attribution queries filter by line_id + event_type + date
CREATE INDEX IF NOT EXISTS idx_events_line_type_created
  ON events (line_id, event_type, created_at DESC)
  WHERE line_id IS NOT NULL;

-- Events: attribution by session_id (comprobante → button_click lookup)
CREATE INDEX IF NOT EXISTS idx_events_session_type
  ON events (session_id, event_type)
  WHERE session_id IS NOT NULL;

-- Events: conversation_start dedup check (phone + project + type + date)
CREATE INDEX IF NOT EXISTS idx_events_phone_project_type
  ON events (project_id, phone, event_type, created_at DESC)
  WHERE phone IS NOT NULL;

-- Sales: ventas page queries filter by project_id + status + date
CREATE INDEX IF NOT EXISTS idx_sales_project_status_created
  ON sales (project_id, status, created_at DESC);

-- Sales: idempotency check by image_url + project_id
CREATE INDEX IF NOT EXISTS idx_sales_image_url
  ON sales (project_id, image_url)
  WHERE image_url IS NOT NULL;

-- Sales: CAPI retry cron — confirmed sales with meta_event_sent = false
CREATE INDEX IF NOT EXISTS idx_sales_capi_retry
  ON sales (status, meta_event_sent, created_at ASC)
  WHERE status = 'confirmed' AND meta_event_sent = false;

-- Contacts: total_purchases sort (default sort in contactos page)
CREATE INDEX IF NOT EXISTS idx_contacts_project_purchases
  ON contacts (project_id, total_purchases DESC);
