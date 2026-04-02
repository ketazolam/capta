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

  // Get project Meta config
  const { data: project } = await supabase
    .from("projects")
    .select("meta_pixel_id, meta_access_token, name")
    .eq("id", projectId)
    .single()

  if (!project?.meta_pixel_id || !project?.meta_access_token) {
    // No Meta config — just mark sale as confirmed
    await supabase.from("sales").update({ status: "confirmed" }).eq("id", saleId)
    return NextResponse.json({ ok: true, capi: false })
  }

  // Send Purchase event to Meta CAPI
  const eventId = `purchase_${nanoid()}`
  await sendMetaEvent({
    pixelId: project.meta_pixel_id,
    accessToken: project.meta_access_token,
    eventName: "Purchase",
    eventId,
    userData: { phone },
    customData: {
      value: amount ?? 0,
      currency: "ARS",
      content_name: project.name,
    },
  })

  // Mark sale as confirmed
  await supabase.from("sales").update({ status: "confirmed", meta_event_sent: true }).eq("id", saleId)

  return NextResponse.json({ ok: true, capi: true, eventId })
}
