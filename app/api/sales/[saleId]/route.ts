import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"

// PATCH /api/sales/[saleId] — confirm or reject a sale
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params
    const body = await req.json()
    const { status, amount, reference, phone, project_id } = body

    if (!["confirmed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "status must be confirmed or rejected" }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Update sale
    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (amount !== undefined) updateData.amount = amount
    if (reference !== undefined) updateData.reference = reference

    const { error: updateErr } = await supabase
      .from("sales")
      .update(updateData)
      .eq("id", saleId)

    if (updateErr) {
      console.error("[Sales PATCH] update error:", updateErr)
      return NextResponse.json({ error: "Failed to update sale" }, { status: 500 })
    }

    // If confirming, fire Meta CAPI Purchase + update contact
    if (status === "confirmed" && project_id) {
      // Get sale record for attribution + double-send guard + visitor data
      const { data: saleRecord } = await supabase
        .from("sales")
        .select("page_id, meta_event_sent, visitor_fbp, visitor_fbc, visitor_ip, visitor_ua, visitor_session_id")
        .eq("id", saleId)
        .single()
      const salePageId = saleRecord?.page_id ?? null
      const alreadySentMeta = saleRecord?.meta_event_sent === true

      // Get pixel config
      const { data: proj } = await supabase
        .from("projects")
        .select("meta_pixel_id, meta_access_token, name, attribution_config")
        .eq("id", project_id)
        .single()

      const purchaseEnabled = proj?.attribution_config?.meta?.purchase !== false
      const pixelId = proj?.meta_pixel_id
      const accessToken = proj?.meta_access_token

      if (pixelId && accessToken && purchaseEnabled && !alreadySentMeta) {
        // Prefer visitor data captured at click time over current request (admin IP/UA)
        const ip = saleRecord?.visitor_ip || req.headers.get("x-forwarded-for")?.split(",")[0] || ""
        const userAgent = saleRecord?.visitor_ua || req.headers.get("user-agent") || ""
        await sendMetaEvent({
          pixelId,
          accessToken,
          eventName: "Purchase",
          eventId: `purchase_${saleId}`,
          userData: {
            phone: phone || undefined,
            client_ip_address: ip || undefined,
            client_user_agent: userAgent || undefined,
            external_id: saleRecord?.visitor_session_id || saleId,
            fbp: saleRecord?.visitor_fbp || undefined,
            fbc: saleRecord?.visitor_fbc || undefined,
          },
          customData: {
            value: amount ?? 0,
            currency: "ARS",
            content_name: proj?.name || "",
          },
        })

        // Mark meta_event_sent
        await supabase.from("sales").update({ meta_event_sent: true }).eq("id", saleId)
      }

        // Insert purchase event for analytics funnel
      await supabase.from("events").insert({
        project_id,
        page_id: salePageId,
        event_type: "purchase",
        session_id: saleId,
        phone: phone || null,
      })

      // Update contact aggregate
      if (phone) {
        await supabase.rpc("increment_contact_purchase", {
          p_project_id: project_id,
          p_phone: phone,
          p_amount: amount || 0,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Sales PATCH]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// DELETE /api/sales/[saleId] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params
  const supabase = await createServiceClient()
  await supabase.from("sales").update({ status: "rejected" }).eq("id", saleId)
  return NextResponse.json({ ok: true })
}
