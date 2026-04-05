import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"

// PATCH /api/sales/[saleId] — confirm or reject a sale
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  try {
    const { saleId } = await params
    const body = await req.json()
    const { status, amount, reference, phone, project_id, reject_reason } = body

    if (!["confirmed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "status must be confirmed or rejected" }, { status: 400 })
    }

    // Auth check — dashboard actions require authenticated user
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Use service client for subsequent DB ops (need to read visitor data, etc.)
    const supabase = await createServiceClient()

    // Read current sale state BEFORE updating (to detect double-confirm)
    // Include project data + org_id for ownership check
    const { data: saleRecord } = await supabase
      .from("sales")
      .select("page_id, amount, status, phone, project_id, meta_event_sent, visitor_fbp, visitor_fbc, visitor_ip, visitor_ua, visitor_session_id, ref_code, pages:page_id(slug), projects(org_id, meta_pixel_id, meta_access_token, name, attribution_config)")
      .eq("id", saleId)
      .single()

    if (!saleRecord) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    // Ownership check — verify user belongs to the org that owns this sale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const saleOrgId = (saleRecord as any)?.projects?.org_id
    if (saleOrgId) {
      const { data: membership } = await supabase
        .from("org_members")
        .select("id")
        .eq("user_id", user.id)
        .eq("org_id", saleOrgId)
        .single()
      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const wasAlreadyConfirmed = saleRecord?.status === "confirmed"

    // Update sale
    const updateData: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
    if (amount !== undefined) updateData.amount = amount
    if (reference !== undefined) updateData.reference = reference
    if (status === "rejected" && reject_reason) updateData.reject_reason = reject_reason

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
      const salePageId = saleRecord?.page_id ?? null

      // Use project data from the joined sale query (no extra round-trip)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const proj = (saleRecord as any)?.projects ?? null
      const purchaseEnabled = proj?.attribution_config?.meta?.purchase !== false
      const pixelId = proj?.meta_pixel_id
      const accessToken = proj?.meta_access_token

      // Atomic CAPI guard: only send if not already sent (prevents race condition)
      if (pixelId && accessToken && purchaseEnabled && !saleRecord?.meta_event_sent) {
        const { data: claimed } = await supabase
          .from("sales")
          .update({ meta_event_sent: true })
          .eq("id", saleId)
          .or("meta_event_sent.is.null,meta_event_sent.eq.false")
          .select("id")
          .single()

        if (claimed) {
          const ip = saleRecord?.visitor_ip || req.headers.get("x-forwarded-for")?.split(",")[0] || ""
          const userAgent = saleRecord?.visitor_ua || req.headers.get("user-agent") || ""
          // Use DB amount as authoritative source — never trust request body for CAPI value
          const capiAmount = Number(saleRecord?.amount ?? 0)
          const pageSlug = (saleRecord as any)?.pages?.slug ?? null

          // Get contact name for fn (improves EMQ)
          let contactName: string | undefined
          if (phone) {
            const { data: contact } = await supabase
              .from("contacts")
              .select("name")
              .eq("project_id", project_id)
              .eq("phone", phone)
              .single()
            contactName = contact?.name?.split(" ")[0] || undefined
          }

          try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta-eight.vercel.app"
            await sendMetaEvent({
              pixelId,
              accessToken,
              eventName: "Purchase",
              eventId: `purchase_${saleId}`,
              sourceUrl: pageSlug ? `${appUrl}/s/${pageSlug}` : appUrl,
              userData: {
                phone: phone || undefined,
                client_ip_address: ip || undefined,
                client_user_agent: userAgent || undefined,
                external_id: saleRecord?.visitor_session_id || saleId,
                fbp: saleRecord?.visitor_fbp || undefined,
                fbc: saleRecord?.visitor_fbc || undefined,
                country: "ar",
                fn: contactName,
              },
              customData: {
                value: capiAmount,
                currency: "ARS",
                content_name: proj?.name || "",
                content_type: "product",
                ref_code: (saleRecord as any)?.ref_code || undefined,
              },
            })
          } catch (err) {
            console.error("[Sales PATCH] CAPI error:", err)
          }
        }
      }

      // Insert purchase event + update contact only if this is a fresh confirm (not double-confirm)
      if (!wasAlreadyConfirmed) {
        await supabase.from("events").insert({
          project_id,
          page_id: salePageId,
          event_type: "purchase",
          session_id: saleId,
          phone: phone || null,
        })

        if (phone) {
          await supabase.rpc("increment_contact_purchase", {
            p_project_id: project_id,
            p_phone: phone,
            p_amount: saleRecord?.amount || 0,
          })
        }
      }
    }

    // If rejecting a previously confirmed sale, decrement contact aggregate + clean up purchase event
    if (status === "rejected" && wasAlreadyConfirmed) {
      const rejPhone = phone || saleRecord?.phone
      const rejProjectId = project_id || saleRecord?.project_id
      const rejAmount = Number(saleRecord?.amount ?? 0)

      // Remove the purchase event to keep events table consistent with sales status
      await supabase
        .from("events")
        .delete()
        .eq("event_type", "purchase")
        .eq("session_id", saleId)
        .eq("project_id", rejProjectId)

      if (rejPhone && rejProjectId) {
        const { data: contact } = await supabase
          .from("contacts")
          .select("total_purchases, purchase_count")
          .eq("project_id", rejProjectId)
          .eq("phone", rejPhone)
          .single()
        if (contact) {
          await supabase
            .from("contacts")
            .update({
              total_purchases: Math.max(0, Number(contact.total_purchases) - rejAmount),
              purchase_count: Math.max(0, Number(contact.purchase_count) - 1),
            })
            .eq("project_id", rejProjectId)
            .eq("phone", rejPhone)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Sales PATCH]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

// DELETE /api/sales/[saleId] — soft delete (same rollback logic as PATCH reject)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { saleId } = await params
  const supabase = await createServiceClient()

  // Fetch sale before updating to check ownership and prior status
  const { data: saleRecord } = await supabase
    .from("sales")
    .select("status, phone, project_id, amount, projects(org_id)")
    .eq("id", saleId)
    .single()

  if (!saleRecord) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Ownership check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const saleOrgId = (saleRecord as any)?.projects?.org_id
  if (saleOrgId) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", saleOrgId)
      .single()
    if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const wasConfirmed = saleRecord.status === "confirmed"

  await supabase.from("sales").update({ status: "rejected" }).eq("id", saleId)

  // If was confirmed, rollback contact aggregates and clean purchase event
  if (wasConfirmed) {
    const rejPhone = saleRecord.phone
    const rejProjectId = saleRecord.project_id
    const rejAmount = Number(saleRecord.amount ?? 0)

    await supabase
      .from("events")
      .delete()
      .eq("event_type", "purchase")
      .eq("session_id", saleId)
      .eq("project_id", rejProjectId)

    if (rejPhone && rejProjectId) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("total_purchases, purchase_count")
        .eq("project_id", rejProjectId)
        .eq("phone", rejPhone)
        .single()
      if (contact) {
        await supabase
          .from("contacts")
          .update({
            total_purchases: Math.max(0, Number(contact.total_purchases) - rejAmount),
            purchase_count: Math.max(0, Number(contact.purchase_count) - 1),
          })
          .eq("project_id", rejProjectId)
          .eq("phone", rejPhone)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
