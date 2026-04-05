import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { isRateLimited } from "@/lib/rate-limit"
import { verifyInternalSecret } from "@/lib/verify-secret"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  if (!verifyInternalSecret(req.headers.get("x-internal-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit: 30 req/min per IP even with valid secret
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  if (isRateLimited(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { saleId, projectId, amount, phone, pageId } = await req.json()

  if (!saleId || !projectId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Get project Meta config — try project-level first, fall back to page-level
  let metaPixelId: string | null = null
  let metaAccessToken: string | null = null
  let projectName = ""
  let purchaseEnabled = true

  const { data: project } = await supabase
    .from("projects")
    .select("meta_pixel_id, meta_access_token, name, attribution_config")
    .eq("id", projectId)
    .single()

  if (project) {
    metaPixelId = project.meta_pixel_id
    metaAccessToken = project.meta_access_token
    projectName = project.name
    if (project.attribution_config?.meta) {
      purchaseEnabled = project.attribution_config.meta.purchase !== false
    }
  }

  // If no project-level config, check if we can get it from a page in this project
  if (!metaPixelId || !metaAccessToken) {
    const { data: pageWithMeta } = await supabase
      .from("pages")
      .select("meta_pixel_id, meta_access_token")
      .eq("project_id", projectId)
      .not("meta_pixel_id", "is", null)
      .not("meta_access_token", "is", null)
      .limit(1)
    if (pageWithMeta?.[0]) {
      metaPixelId = pageWithMeta[0].meta_pixel_id
      metaAccessToken = pageWithMeta[0].meta_access_token
    }
  }

  if (!metaPixelId || !metaAccessToken || !purchaseEnabled) {
    // No Meta config or purchase event disabled — just mark sale as confirmed
    await supabase.from("sales").update({ status: "confirmed" }).eq("id", saleId)
    await supabase.from("events").insert({ project_id: projectId, page_id: pageId || null, event_type: "purchase", session_id: saleId, phone: phone || null })
    // Atomic contact aggregate update
    if (phone && projectId) {
      await supabase.rpc("increment_contact_purchase", {
        p_project_id: projectId,
        p_phone: phone,
        p_amount: amount || 0,
      })
    }
    return NextResponse.json({ ok: true, capi: false })
  }

  // Double-send guard + visitor data
  const { data: saleRecord } = await supabase
    .from("sales")
    .select("meta_event_sent, visitor_fbp, visitor_fbc, visitor_ip, visitor_ua, visitor_session_id")
    .eq("id", saleId)
    .single()

  if (saleRecord?.meta_event_sent === true) {
    // Already sent — just confirm without re-firing CAPI
    await supabase.from("sales").update({ status: "confirmed" }).eq("id", saleId)
    await supabase.from("events").insert({ project_id: projectId, page_id: pageId || null, event_type: "purchase", session_id: saleId, phone: phone || null })
    if (phone && projectId) {
      await supabase.rpc("increment_contact_purchase", { p_project_id: projectId, p_phone: phone, p_amount: amount || 0 })
    }
    return NextResponse.json({ ok: true, capi: false, skipped: "already_sent" })
  }

  // Send Purchase event to Meta CAPI using visitor data captured at click time
  const eventId = `purchase_${saleId}`
  let capiSent = false
  try {
    await sendMetaEvent({
      pixelId: metaPixelId,
      accessToken: metaAccessToken,
      eventName: "Purchase",
      eventId,
      userData: {
        phone,
        client_ip_address: saleRecord?.visitor_ip || undefined,
        client_user_agent: saleRecord?.visitor_ua || undefined,
        external_id: saleRecord?.visitor_session_id || saleId,
        fbp: saleRecord?.visitor_fbp || undefined,
        fbc: saleRecord?.visitor_fbc || undefined,
      },
      customData: {
        value: amount ?? 0,
        currency: "ARS",
        content_name: projectName,
      },
    })
    capiSent = true
  } catch (err) {
    console.error("[webhook/sale] CAPI error:", err)
  }

  // Mark sale as confirmed
  await supabase.from("sales").update({ status: "confirmed", meta_event_sent: capiSent }).eq("id", saleId)
  await supabase.from("events").insert({ project_id: projectId, page_id: pageId || null, event_type: "purchase", session_id: saleId, phone: phone || null })

  // Atomic contact aggregate update
  if (phone && projectId) {
    await supabase.rpc("increment_contact_purchase", {
      p_project_id: projectId,
      p_phone: phone,
      p_amount: amount || 0,
    })
  }

  return NextResponse.json({ ok: true, capi: capiSent, eventId })
}
