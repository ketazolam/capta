import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { analyzeComprobante } from "@/lib/comprobante"
import { isRateLimited } from "@/lib/rate-limit"
import { notifyAdmin } from "@/lib/notify-admin"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret")
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  if (isRateLimited(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const body = await req.json()
  const { project_id, phone, image_url, line_id, auto_confirm = true } = body

  if (!project_id || !image_url) {
    return NextResponse.json({ error: "project_id and image_url required" }, { status: 400 })
  }

  // 1. Analyze comprobante with Claude Vision
  let extracted
  try {
    extracted = await analyzeComprobante(image_url)
  } catch (err) {
    console.error("[webhook/comprobante] Vision error:", err)
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 422 })
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

  // 2. Infer page_id + visitor data from most recent button_click on this line (best-effort attribution)
  let inferred_page_id: string | null = null
  let visitor_fbp: string | null = null
  let visitor_fbc: string | null = null
  let visitor_ip: string | null = null
  let visitor_ua: string | null = null
  let visitor_session_id: string | null = null
  let visitor_ref_code: string | null = null
  let page_slug: string | null = null
  if (line_id) {
    const { data: recentEvent } = await supabase
      .from("events")
      .select("page_id, fbp, fbc, ip, user_agent, session_id, ref_code, pages:page_id(slug)")
      .eq("line_id", line_id)
      .eq("event_type", "button_click")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()
    inferred_page_id = recentEvent?.page_id ?? null
    visitor_fbp = recentEvent?.fbp ?? null
    visitor_fbc = recentEvent?.fbc ?? null
    visitor_ip = recentEvent?.ip ?? null
    visitor_ua = recentEvent?.user_agent ?? null
    visitor_session_id = recentEvent?.session_id ?? null
    visitor_ref_code = recentEvent?.ref_code ?? null
    page_slug = (recentEvent as any)?.pages?.slug ?? null
  }

  // 2B. Validate extracted amount — reject if not a positive number
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

  // Notify admin via Telegram
  {
    const amount = extracted.amount ? `$${extracted.amount.toLocaleString("es-AR")}` : "monto no detectado"
    const confidence = extracted.confidence === "high" ? "✅" : extracted.confidence === "medium" ? "⚠️" : "❓"
    const { data: projectForNotif } = await supabase
      .from("projects")
      .select("name")
      .eq("id", project_id)
      .single()
    const projectName = projectForNotif?.name ? ` — <b>${projectForNotif.name}</b>` : ""
    await notifyAdmin({
      message: `${confidence} <b>Nuevo comprobante${projectName}</b>\n📱 ${phone || "desconocido"}\nMonto: ${amount}\nVer en Capta: ${process.env.NEXT_PUBLIC_APP_URL}/project/${project_id}/ventas`,
    })
  }

  // 3. Auto-confirm if confidence is high AND amount is valid
  const shouldConfirm = auto_confirm && extracted.confidence === "high" && extracted.amount && extracted.amount > 0

  if (!shouldConfirm) {
    return NextResponse.json({
      ok: true,
      sale_id: saleId,
      status: "pending",
      extracted,
    })
  }

  // 4. Get Meta config for the project
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
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
      },
    })
    capiSent = true
  } catch (err) {
    console.error("[webhook/comprobante] CAPI error:", err)
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
