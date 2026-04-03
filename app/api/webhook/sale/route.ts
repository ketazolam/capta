import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { NextResponse } from "next/server"
import { nanoid } from "nanoid"

export async function POST(req: Request) {
  // Verify internal secret
  const secret = req.headers.get("x-internal-secret")
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { saleId, lineId, projectId, amount, phone } = await req.json()

  if (!saleId || !projectId) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Get project Meta config — try project-level first, fall back to page-level
  let metaPixelId: string | null = null
  let metaAccessToken: string | null = null
  let projectName = ""
  let purchaseEnabled = true

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("meta_pixel_id, meta_access_token, name, attribution_config")
    .eq("id", projectId)
    .single()

  if (projErr && projErr.code === "42703") {
    // meta columns don't exist yet — try getting just the name
    const { data: pBasic } = await supabase.from("projects").select("name").eq("id", projectId).single()
    projectName = pBasic?.name || ""
  } else if (project) {
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
    if (phone && projectId) {
      const { data: existing } = await supabase
        .from("contacts")
        .select("id, purchase_count, total_purchases")
        .eq("project_id", projectId)
        .eq("phone", phone)
        .single()
      if (existing) {
        await supabase.from("contacts").update({
          purchase_count: (existing.purchase_count || 0) + 1,
          total_purchases: (Number(existing.total_purchases) || 0) + (amount || 0),
          last_seen_at: new Date().toISOString(),
        }).eq("id", existing.id)
      }
    }
    return NextResponse.json({ ok: true, capi: false })
  }

  // Send Purchase event to Meta CAPI
  const eventId = `purchase_${nanoid()}`
  await sendMetaEvent({
    pixelId: metaPixelId,
    accessToken: metaAccessToken,
    eventName: "Purchase",
    eventId,
    userData: { phone },
    customData: {
      value: amount ?? 0,
      currency: "ARS",
      content_name: projectName,
    },
  })

  // Mark sale as confirmed
  await supabase.from("sales").update({ status: "confirmed", meta_event_sent: true }).eq("id", saleId)

  // Update contact aggregates
  if (phone && projectId) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id, purchase_count, total_purchases")
      .eq("project_id", projectId)
      .eq("phone", phone)
      .single()
    if (existing) {
      await supabase.from("contacts").update({
        purchase_count: (existing.purchase_count || 0) + 1,
        total_purchases: (Number(existing.total_purchases) || 0) + (amount || 0),
        last_seen_at: new Date().toISOString(),
      }).eq("id", existing.id)
    }
  }

  return NextResponse.json({ ok: true, capi: true, eventId })
}
