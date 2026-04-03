import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { analyzeComprobante } from "@/lib/comprobante"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret")
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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

  // 2. Create sale as pending
  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      project_id,
      phone: phone || null,
      line_id: line_id || null,
      amount: extracted.amount,
      reference: extracted.reference,
      image_url,
      raw_text: extracted.raw_text,
      status: "pending",
    })
    .select("id")
    .single()

  if (saleErr || !sale) {
    console.error("[webhook/comprobante] Insert sale error:", saleErr)
    return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
  }

  const saleId = sale.id

  // 3. Auto-confirm if confidence is high
  const shouldConfirm = auto_confirm && extracted.confidence === "high" && extracted.amount

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

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("meta_pixel_id, meta_access_token, name, attribution_config")
    .eq("id", project_id)
    .single()

  if (projErr && projErr.code === "42703") {
    const { data: pBasic } = await supabase.from("projects").select("name").eq("id", project_id).single()
    projectName = pBasic?.name || ""
  } else if (project) {
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
  await sendMetaEvent({
    pixelId: metaPixelId,
    accessToken: metaAccessToken,
    eventName: "Purchase",
    eventId,
    userData: {
      phone,
      external_id: saleId,
    },
    customData: {
      value: extracted.amount ?? 0,
      currency: "ARS",
      content_name: projectName,
    },
  })

  await supabase
    .from("sales")
    .update({ status: "confirmed", meta_event_sent: true })
    .eq("id", saleId)

  if (phone) {
    await supabase.rpc("increment_contact_purchase", {
      p_project_id: project_id,
      p_phone: phone,
      p_amount: extracted.amount || 0,
    })
  }

  return NextResponse.json({ ok: true, sale_id: saleId, status: "confirmed", extracted, capi: true, eventId })
}
