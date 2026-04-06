import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { analyzeComprobante } from "@/lib/comprobante"
import { isRateLimited } from "@/lib/rate-limit"
import { notifyAdmin } from "@/lib/notify-admin"
import { verifyInternalSecret } from "@/lib/verify-secret"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  if (!verifyInternalSecret(req.headers.get("x-internal-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Parse body first so we can use line_id as rate limit key
  // (Railway has a fixed outbound IP — per-IP rate limit blocks all lines at once)
  const body = await req.json()
  const { project_id, phone, image_url, line_id } = body

  const rateLimitKey = line_id || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  if (isRateLimited(rateLimitKey, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  if (!project_id || !image_url) {
    return NextResponse.json({ error: "project_id and image_url required" }, { status: 400 })
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(project_id)) {
    return NextResponse.json({ error: "Invalid project_id" }, { status: 400 })
  }

  // 1. Analyze comprobante with Claude Vision
  // If Vision fails (e.g. Anthropic credits exhausted), create a pending sale with null amount
  // so the admin can review it manually — prevents total loss of the comprobante
  let extracted
  try {
    extracted = await analyzeComprobante(image_url)
  } catch (err) {
    const errMsg = (err as Error).message || String(err)
    console.error("[webhook/comprobante] Vision error:", errMsg)
    // Fallback: continue with null extracted data — sale will be created as pending
    extracted = { amount: null, reference: null, bank: null, date: null, recipient: null, confidence: "low", raw_text: "" }
    await notifyAdmin({
      message: `⚠️ <b>VISION FALLÓ — revisión manual requerida</b>\n📱 ${phone || "?"}\n🔗 ${image_url}\n❌ ${errMsg}\n\nSe creó venta pendiente sin monto — confirmala manualmente.`,
    })
  }

  const supabase = await createServiceClient()

  // Idempotency: if same image_url + project was already processed, skip duplicate
  const { data: existingSale } = await supabase
    .from("sales")
    .select("id, status")
    .eq("project_id", project_id)
    .eq("image_url", image_url)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  if (existingSale) {
    console.warn("[webhook/comprobante] Duplicate image_url detected, skipping:", existingSale.id)
    return NextResponse.json({ ok: true, sale_id: existingSale.id, status: existingSale.status, duplicate: true })
  }

  // 2. Infer page_id + visitor data via attribution chain:
  //    Priority 1: phone → conversation_start → session_id → button_click (exact per-lead)
  //    Priority 2: most recent button_click on this line (fallback, can misattribute with concurrent leads)
  let inferred_page_id: string | null = null
  let visitor_fbp: string | null = null
  let visitor_fbc: string | null = null
  let visitor_ip: string | null = null
  let visitor_ua: string | null = null
  let visitor_session_id: string | null = null
  let visitor_ref_code: string | null = null
  let page_slug: string | null = null
  if (line_id) {
    let clickEvent: Record<string, unknown> | null = null

    // Priority 1: find this lead's conversation_start → get their session_id → find their button_click
    if (phone) {
      const { data: convEvent } = await supabase
        .from("events")
        .select("session_id")
        .eq("line_id", line_id)
        .eq("event_type", "conversation_start")
        .eq("phone", phone)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (convEvent?.session_id) {
        const { data: exactClick } = await supabase
          .from("events")
          .select("page_id, fbp, fbc, ip, user_agent, session_id, ref_code, pages:page_id(slug)")
          .eq("session_id", convEvent.session_id)
          .eq("event_type", "button_click")
          .limit(1)
          .single()
        if (exactClick) clickEvent = exactClick as Record<string, unknown>
      }
    }

    // Priority 2: fallback to most recent button_click on this line (max 48h old)
    if (!clickEvent) {
      const fortyEightHAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      const { data: recentEvent } = await supabase
        .from("events")
        .select("page_id, fbp, fbc, ip, user_agent, session_id, ref_code, pages:page_id(slug)")
        .eq("line_id", line_id)
        .eq("event_type", "button_click")
        .gte("created_at", fortyEightHAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (recentEvent) clickEvent = recentEvent as Record<string, unknown>
    }

    if (clickEvent) {
      inferred_page_id = (clickEvent.page_id as string) ?? null
      visitor_fbp = (clickEvent.fbp as string) ?? null
      visitor_fbc = (clickEvent.fbc as string) ?? null
      visitor_ip = (clickEvent.ip as string) ?? null
      visitor_ua = (clickEvent.user_agent as string) ?? null
      visitor_session_id = (clickEvent.session_id as string) ?? null
      visitor_ref_code = (clickEvent.ref_code as string) ?? null
      page_slug = (clickEvent as any)?.pages?.slug ?? null
    }
  }

  // 2B. Dedup: same phone + same amount within 30 minutes = probable duplicate resend
  if (phone && extracted.amount && extracted.amount > 0) {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    const { data: recentSale } = await supabase
      .from("sales")
      .select("id, status")
      .eq("project_id", project_id)
      .eq("phone", phone)
      .eq("amount", extracted.amount)
      .gte("created_at", thirtyMinAgo)
      .limit(1)
      .single()
    if (recentSale) {
      console.warn("[webhook/comprobante] Duplicate phone+amount+30min detected:", recentSale.id)
      return NextResponse.json({ ok: true, sale_id: recentSale.id, status: recentSale.status, duplicate: true, reason: "same_phone_amount_30min" })
    }
  }

  // 2C. Validate extracted amount — reject if not a positive number
  if (!extracted.amount || extracted.amount <= 0) {
    console.warn("[webhook/comprobante] Monto no válido:", extracted.amount, "— guardando como pendiente sin auto-confirm")
  }

  // 3. Create sale as pending
  // Buscar contact_id si hay phone
  let contact_id: string | null = null
  let contact_name: string | null = null
  if (phone) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("id, name")
      .eq("project_id", project_id)
      .eq("phone", phone)
      .single()
    contact_id = contact?.id ?? null
    contact_name = contact?.name ?? null
  }

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      project_id,
      page_id: inferred_page_id,
      phone: phone || null,
      line_id: line_id || null,
      contact_id,
      amount: extracted.amount,
      reference: extracted.reference,
      bank: extracted.bank,
      confidence: extracted.confidence,
      recipient: extracted.recipient,
      transaction_date: extracted.date,
      image_url,
      raw_text: extracted.raw_text,
      status: "pending",
      visitor_fbp,
      visitor_fbc,
      visitor_ip,
      visitor_ua,
      visitor_session_id,
      ref_code: visitor_ref_code,
    })
    .select("id")
    .single()

  if (saleErr || !sale) {
    console.error("[webhook/comprobante] Insert sale error:", saleErr)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }

  const saleId = sale.id

  // 3. Fetch project config (name + Meta) in a single query
  let metaPixelId: string | null = null
  let metaAccessToken: string | null = null
  let projectName = ""
  let purchaseEnabled = true

  const { data: project } = await supabase
    .from("projects")
    .select("meta_pixel_id, meta_access_token, name, attribution_config")
    .eq("id", project_id)
    .single()

  if (project) {
    metaPixelId = project.meta_pixel_id
    metaAccessToken = project.meta_access_token
    projectName = project.name
    if (project.attribution_config?.meta) {
      purchaseEnabled = project.attribution_config.meta.purchase !== false
    }
  }

  // Notify admin: new comprobante received
  {
    const amountStr = extracted.amount ? `$${extracted.amount.toLocaleString("es-AR")}` : "monto no detectado"
    const confidenceIcon = extracted.confidence === "high" ? "✅" : extracted.confidence === "medium" ? "⚠️" : "❓"
    const projectLabel = projectName ? ` — <b>${projectName}</b>` : ""
    await notifyAdmin({
      message: `${confidenceIcon} <b>Nuevo comprobante${projectLabel}</b>\n📱 ${phone || "desconocido"}\nMonto: ${amountStr}\nVer en Capta: ${process.env.NEXT_PUBLIC_APP_URL}/project/${project_id}/ventas`,
    })
  }

  if (!metaPixelId || !metaAccessToken) {
    const { data: pageWithMeta } = await supabase
      .from("pages")
      .select("meta_pixel_id, meta_access_token")
      .eq("project_id", project_id)
      .not("meta_pixel_id", "is", null)
      .not("meta_access_token", "is", null)
      .limit(1)
    if (pageWithMeta?.[0]) {
      metaPixelId = pageWithMeta[0].meta_pixel_id
      metaAccessToken = pageWithMeta[0].meta_access_token
    }
  }

  // 5. Confirm sale + fire Meta CAPI if configured
  if (!metaPixelId || !metaAccessToken || !purchaseEnabled) {
    await supabase.from("sales").update({ status: "confirmed" }).eq("id", saleId)
    await supabase.from("events").insert({ project_id, page_id: inferred_page_id, event_type: "purchase", session_id: saleId, phone: phone || null })
    if (phone) {
      await supabase.rpc("increment_contact_purchase", {
        p_project_id: project_id,
        p_phone: phone,
        p_amount: extracted.amount || 0,
      })
    }
    return NextResponse.json({ ok: true, sale_id: saleId, status: "confirmed", extracted, capi: false })
  }

  const eventId = `purchase_${saleId}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta-eight.vercel.app"
  let capiSent = false
  try {
    await sendMetaEvent({
      pixelId: metaPixelId,
      accessToken: metaAccessToken,
      eventName: "Purchase",
      eventId,
      sourceUrl: page_slug ? `${appUrl}/s/${page_slug}` : appUrl,
      userData: {
        phone,
        external_id: visitor_session_id || saleId,
        fbp: visitor_fbp || undefined,
        fbc: visitor_fbc || undefined,
        client_ip_address: visitor_ip || undefined,
        client_user_agent: visitor_ua || undefined,
        country: "ar",
        fn: contact_name?.split(" ")[0] || undefined,
      },
      customData: {
        value: extracted.amount ?? 0,
        currency: "ARS",
        content_name: projectName,
        content_type: "product",
        ref_code: visitor_ref_code || undefined,
      },
    })
    capiSent = true
  } catch (err) {
    console.error("[webhook/comprobante] CAPI error:", err)
    await notifyAdmin({
      message: `🚨 <b>CAPI FALLÓ</b>\n📱 ${phone || "?"}\n💰 $${extracted.amount?.toLocaleString("es-AR") || "?"}\n❌ ${(err as Error).message}\n⚠️ Venta confirmada pero NO enviada a Meta.`,
    })
  }

  await supabase
    .from("sales")
    .update({ status: "confirmed", meta_event_sent: capiSent })
    .eq("id", saleId)
  await supabase.from("events").insert({ project_id, page_id: inferred_page_id, event_type: "purchase", session_id: saleId, phone: phone || null })

  if (phone) {
    await supabase.rpc("increment_contact_purchase", {
      p_project_id: project_id,
      p_phone: phone,
      p_amount: extracted.amount || 0,
    })
  }

  return NextResponse.json({ ok: true, sale_id: saleId, status: "confirmed", extracted, capi: true, eventId })
}
