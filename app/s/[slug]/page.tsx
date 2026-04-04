import { createServiceClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { after } from "next/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { nanoid } from "nanoid"
import type { TemplateProps } from "@/lib/templates/types"
import type { ComponentType } from "react"

// Direct imports of template components — server components can render client components,
// but cannot use getTemplate() from a registry that imports "use client" modules.
// Add new templates here as they're created.
import { WhatsAppRedirectTemplate } from "@/lib/templates/components/whatsapp-redirect"
import { PalaceCasinoTemplate } from "@/lib/templates/components/palace-casino"
import MetaPixel from "@/lib/templates/components/shared/MetaPixel"

const TEMPLATE_COMPONENTS: Record<string, ComponentType<TemplateProps>> = {
  "whatsapp-redirect": WhatsAppRedirectTemplate,
  "palace-casino": PalaceCasinoTemplate,
}

// Crawler/bot user agents — skip tracking for these
const BOT_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "facebookcatalog",
  "FacebookBot",
  "meta-externalagent",
]

function isBot(userAgent: string): boolean {
  return BOT_AGENTS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createServiceClient()
  const { data: pages } = await supabase
    .from("pages")
    .select("template_config, whatsapp_message")
    .eq("slug", slug)
    .eq("is_published", true)
    .limit(1)
  const page = pages?.[0]
  const siteName = (page?.template_config as Record<string, unknown>)?.siteName as string | undefined
  const title = siteName ? `${siteName} — Entretenimiento Online` : "Entretenimiento Online"
  return {
    title,
    description: "Registrate y reclamá tu bono de bienvenida.",
  }
}

export default async function SmartLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string; utm_source?: string; utm_campaign?: string; fbclid?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || ""
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || ""

  // Extract Meta tracking cookies from Cookie header (server-side)
  const cookieHeader = headersList.get("cookie") || ""
  const fbp = cookieHeader.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1] ?? undefined
  // fbc: prefer cookie, fall back to building from fbclid if present
  const fbcCookie = cookieHeader.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1]
  const fbc = fbcCookie ?? (sp.fbclid ? `fb.1.${Date.now()}.${sp.fbclid}` : undefined)

  const supabase = await createServiceClient()

  // Find the page by slug (across all projects) — use limit(1) instead of single()
  // to avoid error when multiple pages share a slug across different projects
  const { data: pages } = await supabase
    .from("pages")
    .select("*, projects(id, org_id)")
    .eq("slug", slug)
    .eq("is_published", true)
    .limit(1)
    // template_id and template_config are included via *

  const page = pages?.[0] ?? null

  if (!page) notFound()

  // Bot detection — show safe/alternative content
  if (isBot(userAgent)) {
    return <BotContent pageName={slug} />
  }

  // Line selection: preferred_line_id → if active+connected use it; otherwise round-robin
  type LineRow = { id: string; phone_number: string | null; name: string }
  let targetLine: LineRow | null = null

  const preferredLineId = (page as Record<string, unknown>).preferred_line_id as string | null
  if (preferredLineId) {
    const { data: preferred } = await supabase
      .from("lines")
      .select("id, phone_number, name")
      .eq("id", preferredLineId)
      .eq("is_active", true)
      .eq("status", "connected")
      .single()
    targetLine = preferred ?? null
  }

  // Fallback: round-robin across all active+connected lines in the project
  if (!targetLine) {
    const { data: lines } = await supabase
      .from("lines")
      .select("id, phone_number, name")
      .eq("project_id", page.project_id)
      .eq("is_active", true)
      .eq("status", "connected")

    if (!lines || lines.length === 0) {
      // No connected lines — fallback to any active line to avoid breaking the page
      const { data: fallbackLines } = await supabase
        .from("lines")
        .select("id, phone_number, name")
        .eq("project_id", page.project_id)
        .eq("is_active", true)
        .limit(1)
      targetLine = fallbackLines?.[0] ?? null
    } else if (lines.length === 1) {
      targetLine = lines[0]
    } else {
      const { data: usageData } = await supabase
        .rpc("get_line_usage_counts", { p_project_id: page.project_id })
      const countMap: Record<string, number> = {}
      usageData?.forEach((row: { line_id: string; usage_count: number }) => {
        countMap[row.line_id] = row.usage_count
      })
      targetLine = lines.reduce((min, line) =>
        (countMap[line.id] || 0) < (countMap[min.id] || 0) ? line : min
      )
    }
  }

  // Resolve pixel config + attribution config: page-level first, then project-level
  let pixelId = page.meta_pixel_id
  let accessToken = page.meta_access_token
  let pageViewEnabled = true
  if (!pixelId || !accessToken) {
    const { data: proj } = await supabase
      .from("projects")
      .select("meta_pixel_id, meta_access_token, attribution_config")
      .eq("id", page.project_id)
      .single()
    if (proj?.meta_pixel_id && proj?.meta_access_token) {
      pixelId = proj.meta_pixel_id
      accessToken = proj.meta_access_token
    }
    if (proj?.attribution_config?.meta) {
      pageViewEnabled = proj.attribution_config.meta.page_view !== false
    }
  } else {
    // Pixel from page-level; still check project attribution config
    const { data: proj } = await supabase
      .from("projects")
      .select("attribution_config")
      .eq("id", page.project_id)
      .single()
    if (proj?.attribution_config?.meta) {
      pageViewEnabled = proj.attribution_config.meta.page_view !== false
    }
  }

  // Track PageView — sessionId doubles as external_id for cross-event linking
  const sessionId = nanoid()
  if (pixelId && accessToken && pageViewEnabled) {
    // Fire-and-forget after response is sent — CAPI must not block page render
    after(() =>
      sendMetaEvent({
        pixelId: pixelId!,
        accessToken: accessToken!,
        eventName: "PageView",
        eventId: `pv_${sessionId}`,
        userData: {
          client_ip_address: ip,
          client_user_agent: userAgent,
          fbp,
          fbc,
          external_id: sessionId,
        },
        sourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/s/${slug}`,
      }).catch((err) => console.error("[SmartLink] PageView CAPI error:", err))
    )
  }

  const { error: eventInsertError } = await supabase.from("events").insert({
    project_id: page.project_id,
    page_id: page.id,
    event_type: "page_view",
    session_id: sessionId,
    ip,
    user_agent: userAgent,
    ref_code: sp.ref,
    fbp: fbp || null,
    fbc: fbc || null,
  })

  if (eventInsertError) {
    console.error("[SmartLink] page_view insert error:", eventInsertError)
  }

  const waMessage = page.whatsapp_message?.replace("{{ref}}", sp.ref || "") || "Hola!"
  const waPhone = targetLine?.phone_number?.replace(/\D/g, "") || null

  const templateId = (page.template_id as string | null) ?? "whatsapp-redirect"
  const TemplateComponent = TEMPLATE_COMPONENTS[templateId] ?? TEMPLATE_COMPONENTS["whatsapp-redirect"]

  return (
    <>
      {pixelId && <MetaPixel pixelId={pixelId} pageViewEventId={`pv_${sessionId}`} />}
      <TemplateComponent
        pageId={page.id}
        projectId={page.project_id}
        sessionId={sessionId}
        waPhone={waPhone}
        waMessage={waMessage}
        autoRedirect={page.auto_redirect}
        lineId={targetLine?.id || null}
        config={(page.template_config as Record<string, unknown>) ?? {}}
        fbp={fbp}
        fbc={fbc}
      />
    </>
  )
}

function BotContent({ pageName }: { pageName: string }) {
  return (
    <div style={{ fontFamily: "sans-serif", padding: "40px", color: "#999", background: "#0a0a0a", minHeight: "100vh" }}>
      <h1 style={{ color: "#fff" }}>Bienvenido</h1>
      <p>Página de atención al cliente — {pageName}. Contactanos para más información.</p>
    </div>
  )
}
