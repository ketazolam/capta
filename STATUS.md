# Capta — Estado del Proyecto

> Actualizado: 2026-04-06

---

## Arquitectura

| Capa | Tech | Host |
|------|------|------|
| Frontend / API | Next.js 15 (App Router) | Vercel |
| Base de datos | Supabase (PostgreSQL + Storage + RLS) | Supabase Cloud |
| WhatsApp | capta-baileys (Baileys WS) | Railway |
| CAPI | Meta Conversions API | (via Vercel API routes) |

**App URL producción**: `https://capta-eight.vercel.app`  
**Repo**: `github.com/ketazolam/capta`  
**Baileys**: `/Users/tommyotegui/capta-baileys`

---

## Smart Links — Templates disponibles

| Template ID | Descripción |
|-------------|-------------|
| `whatsapp-redirect` | Botón simple de WhatsApp + tracking |
| `palace-casino` | Landing casino completo (hero, contador, testimonios, jackpot, CTA) |

---

## Páginas en producción

| Slug / Dominio | Template | Estado | Notas |
|----------------|----------|--------|-------|
| `ganamosmedia.com` | palace-casino | **ACTIVO** — apunta aquí la publicidad Meta | Dominio custom configurado en Vercel |
| `test-palace` | palace-casino | **OBSOLETO** — eliminar de Supabase | Era slug de prueba, ya no se usa |

### Cómo eliminar `test-palace`
En la app: ir a **Proyecto → Páginas → test-palace → Eliminar** (hay botón `DeletePageButton`).  
O directo en Supabase: `DELETE FROM pages WHERE slug = 'test-palace'`.

---

## Flujo principal

```
Meta Ad → ganamosmedia.com/s/[slug]?fbclid=...
         ↓
  SmartLinkPage (SSR Next.js)
  - Registra page_view en events
  - Dispara CAPI PageView (fire-and-forget via after())
  - Inyecta Meta Pixel (browser pixel para deduplicación)
  - Selecciona línea WhatsApp (preferred_line o round-robin)
         ↓
  Usuario hace clic en botón → /api/events (button_click)
         ↓
  Redirige a wa.me/[número]?text=[mensaje con code]
         ↓
  Baileys (Railway) recibe mensaje
  - sessions.js: upsert contacto en Supabase
  - notify.js: POST a /api/webhook/conversation (conversation_start)
         ↓
  Usuario manda comprobante de pago (imagen)
         ↓
  notify.js: POST a /api/webhook/comprobante
  - Claude Vision analiza imagen → extrae monto, banco, referencia
  - Crea sale en Supabase (status: pending)
  - Infiere atribución: phone → session_id → button_click original
  - Dispara CAPI Purchase con datos del lead
  - Confirma sale (status: confirmed)
  - Notifica admin vía Telegram
```

---

## Panel admin — Páginas clave

| Ruta | Descripción |
|------|-------------|
| `/dashboard` | Lista de proyectos |
| `/project/[id]/analytics` | Embudo + Revenue + Meta CAPI % |
| `/project/[id]/ventas` | Tabla de ventas (pending/confirmed) |
| `/project/[id]/contactos` | Contactos del proyecto |
| `/project/[id]/lineas` | Líneas WhatsApp + QR |
| `/project/[id]/paginas` | Smart links del proyecto |
| `/project/[id]/settings/general` | Config Meta Pixel |

---

## Fixes recientes (2026-04-06)

### Round 1 — Bugs críticos (contactos + ventas)
- **contactos/page.tsx**: sort default `"purchases"` → `"recent"` (leads nuevos se ocultaban)
- **refresh-button.tsx**: componente nuevo — muestra "hace Xs" + botón refresh en ventas/contactos
- **notify.js**: upsert directo de contacto en `conversation_start` (antes solo hacía HTTP webhook)
- **notify.js**: error handling en `case 'message'` (fallo silencioso → ahora logea)
- **sessions.js**: pre-carga `_projectId` al crear sesión (antes era lazy — podía perder primer mensaje)

### Round 2 — Correctivos menores
- **analytics/page.tsx**: cap tasa de conversión y embudos al 100% (ventas manuales inflaban métricas)
- **webhook/comprobante**: vincula `contact_id` después de `increment_contact_purchase` en ambos code paths
- **line-card.tsx**: muestra "—" en vez de "0 días" cuando `days_remaining=0` e `is_active=true`
- **meta-connect-section.tsx**: `aria-hidden` en ícono "f" (lectores de pantalla leían "fMeta Ads")

---

## Estructura de archivos clave

```
capta/
├── app/
│   ├── s/[slug]/page.tsx              # Render de smart links (SSR)
│   ├── api/
│   │   ├── webhook/comprobante/       # Recibe imágenes de pago → Vision → CAPI
│   │   ├── webhook/conversation/      # Recibe evento conversation_start
│   │   ├── events/                    # Registra button_click del browser
│   │   ├── lines/[lineId]/            # CRUD + QR + start de líneas
│   │   ├── projects/[projectId]/      # CRUD proyectos + export
│   │   └── auth/meta/                 # OAuth Meta + selector de pixel
│   └── project/[projectId]/
│       ├── analytics/page.tsx
│       ├── ventas/page.tsx
│       ├── contactos/page.tsx
│       ├── lineas/page.tsx
│       └── paginas/[pageId]/page.tsx  # Editor de páginas (template + config)
├── lib/
│   ├── templates/
│   │   ├── components/
│   │   │   ├── palace-casino/         # Template casino (24+ componentes)
│   │   │   └── whatsapp-redirect.tsx  # Template básico
│   │   └── registry.ts
│   ├── meta-capi.ts                   # Helper sendMetaEvent
│   ├── comprobante.ts                 # Claude Vision para analizar comprobantes
│   └── supabase/
└── components/
    ├── project/
    │   ├── line-card.tsx
    │   ├── meta-connect-section.tsx
    │   └── contacts-table.tsx
    └── ui/
        └── refresh-button.tsx

capta-baileys/
├── sessions.js      # Gestión de sesiones WhatsApp + upserts de contactos
└── notify.js        # Procesamiento de mensajes → eventos → webhooks
```

---

## Pendientes / Deuda técnica

- [ ] **Eliminar página `test-palace`** de Supabase (slug obsoleto)
- [ ] Revisar template `palace-casino` en producción (sección video/hero puede tener delay de carga)
- [ ] Confirmar que `ganamosmedia.com` tiene `custom_domain` seteado correctamente en la página
- [ ] Verificar que `preferred_line_id` esté configurado en la página de ganamosmedia.com
- [ ] Retry automático de CAPI fallidos (`/api/cron/retry-capi` — revisar si está activo en Vercel)

---

## Variables de entorno necesarias

```
NEXT_PUBLIC_APP_URL=https://capta-eight.vercel.app
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
META_APP_ID=
META_APP_SECRET=
ANTHROPIC_API_KEY=
INTERNAL_SECRET=
NEXT_PUBLIC_ADMIN_TELEGRAM_CHAT_ID=
TELEGRAM_BOT_TOKEN=
```
