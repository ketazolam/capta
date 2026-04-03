-- Fase 3: Sistema de templates React/TS para páginas
-- Agrega soporte para templates configurables por página

-- template_id: clave del template en el registry (default: backward-compat con el redirect de WA)
ALTER TABLE pages ADD COLUMN IF NOT EXISTS template_id text DEFAULT 'whatsapp-redirect';

-- Renombrar builder_data (columna muerta) a template_config
ALTER TABLE pages RENAME COLUMN builder_data TO template_config;

COMMENT ON COLUMN pages.template_id IS 'Clave del template en el registry (ej: whatsapp-redirect, lead-capture)';
COMMENT ON COLUMN pages.template_config IS 'Configuración JSON específica del template (colores, textos, imágenes, etc.)';
