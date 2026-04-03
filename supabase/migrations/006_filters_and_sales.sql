-- Migration 006: filtros en analytics + soporte comprobante en ventas

-- 1. Update get_analytics_summary RPC para soportar filtro por página opcional
CREATE OR REPLACE FUNCTION get_analytics_summary(
  p_project_id uuid,
  p_since timestamptz,
  p_page_id uuid DEFAULT NULL
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
    AND (p_page_id IS NULL OR page_id = p_page_id)
  GROUP BY event_type, event_date
  ORDER BY event_date;
$$;

-- 2. Agregar columnas de comprobante a sales si no existen
ALTER TABLE sales ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS raw_text text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS meta_event_sent boolean DEFAULT false;

-- 3. RPC para confirmar venta atómicamente (sin depender del webhook externo)
CREATE OR REPLACE FUNCTION confirm_sale(
  p_sale_id uuid,
  p_amount numeric DEFAULT NULL,
  p_reference text DEFAULT NULL
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE sales
  SET
    status = 'confirmed',
    amount = COALESCE(p_amount, amount),
    reference = COALESCE(p_reference, reference),
    updated_at = now()
  WHERE id = p_sale_id;
$$;

-- 4. Agregar updated_at a sales si no existe
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
