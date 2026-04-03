import { createServiceClient } from "@/lib/supabase/server"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import SmartLinkClient from "./smart-link-client"
import { sendMetaEvent } from "@/lib/meta-capi"
import { nanoid } from "nanoid"

// Facebook/Meta crawler user agents
const META_BOT_AGENTS = [
  "facebookexternalhit",
  "Facebot",
  "facebookcatalog",
  "FacebookBot",
  "meta-externalagent",
  "LinkedInBot",
]

function isMetaBot(userAgent: string): boolean {
  return META_BOT_AGENTS.some((bot) =>
    userAgent.toLowerCase().includes(bot.toLowerCase())
  )
}

export default async function SmartLinkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string; utm_source?: string; utm_campaign?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const headersList = await headers()
  const userAgent = headersList.get("user-agent") || ""
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || ""

  const supabase = await createServiceClient()

  // Find the page by slug (across all projects) — use limit(1) instead of single()
  // to avoid error when multiple pages share a slug across different projects
  const { data: pages } = await supabase
    .from("pages")
    .select("*, projects(id, org_id)")
    .eq("slug", slug)
    .eq("is_published", true)
    .limit(1)

  const page = pages?.[0] ?? null

  if (!page) notFound()

  // Bot detection — show safe/alternative content
  if (isMetaBot(userAgent)) {
    return <BotContent pageName={slug} />
  }

  // Find active lines for this project, load balance
  const { data: lines } = await supabase
    .from("lines")
    .select("id, phone_number, name")
    .eq("project_id", page.project_id)
    .eq("is_active", true)
    .eq("status", "connected")

  // Round-robin: pick next line based on event count
  const { data: usageCounts } = await supabase
    .from("events")
    .select("line_id")
    .eq("project_id", page.project_id)
    .eq("event_type", "conversation_start")

  let targetLine = lines?.[0] || null
  if (lines && lines.length > 1 && usageCounts) {
    const countMap: Record<string, number> = {}
    usageCounts.forEach((e) => {
      if (e.line_id) countMap[e.line_id] = (countMap[e.line_id] || 0) + 1
    })
    targetLine = lines.reduce((min, line) =>
      (countMap[line.id] || 0) < (countMap[min.id] || 0) ? line : min
    )
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

  // Track PageView
  const sessionId = nanoid()
  if (pixelId && accessToken && pageViewEnabled) {
    await sendMetaEvent({
      pixelId,
      accessToken,
      eventName: "PageView",
      eventId: nanoid(),
      userData: { client_ip_address: ip, client_user_agent: userAgent },
      sourceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/s/${slug}`,
    })
  }

  await supabase.from("events").insert({
    project_id: page.project_id,
    page_id: page.id,
    event_type: "page_view",
    session_id: sessionId,
    ip,
    user_agent: userAgent,
    ref_code: sp.ref,
  })

  const waMessage = page.whatsapp_message?.replace("{{ref}}", sp.ref || "") || "Hola!"
  const waPhone = targetLine?.phone_number?.replace(/\D/g, "") || null

  return (
    <SmartLinkClient
      pageId={page.id}
      projectId={page.project_id}
      sessionId={sessionId}
      waPhone={waPhone}
      waMessage={waMessage}
      autoRedirect={page.auto_redirect}
      metaPixelId={page.meta_pixel_id}
      metaAccessToken={page.meta_access_token}
      lineId={targetLine?.id || null}
    />
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
