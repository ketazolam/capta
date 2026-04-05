import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { NextResponse } from "next/server"

// Vercel cron job — runs every 15 minutes via vercel.json
// Retries Purchase CAPI for confirmed sales where meta_event_sent = false
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createServiceClient()

  // Find confirmed sales with failed CAPI (up to 50 per run)
  const { data: sales, error } = await supabase
    .from("sales")
    .select("id, project_id, page_id, phone, amount, visitor_fbp, visitor_fbc, visitor_ip, visitor_ua, visitor_session_id, ref_code, created_at")
    .eq("status", "confirmed")
    .or("meta_event_sent.is.null,meta_event_sent.eq.false")
    .order("created_at", { ascending: true })
    .limit(50)

  if (error) {
    console.error("[cron/retry-capi] DB error:", error)
    return NextResponse.json({ error: "DB error" }, { status: 500 })
  }

  if (!sales || sales.length === 0) {
    return NextResponse.json({ ok: true, retried: 0 })
  }

  let succeeded = 0
  let failed = 0

  for (const sale of sales) {
    // Get project Meta config
    const { data: proj } = await supabase
      .from("projects")
      .select("meta_pixel_id, meta_access_token, name, attribution_config")
      .eq("id", sale.project_id)
      .single()

    const purchaseEnabled = proj?.attribution_config?.meta?.purchase !== false
    const pixelId = proj?.meta_pixel_id
    const accessToken = proj?.meta_access_token

    if (!pixelId || !accessToken || !purchaseEnabled) {
      // No CAPI config — mark as sent so we don't retry forever
      await supabase.from("sales").update({ meta_event_sent: true }).eq("id", sale.id)
      continue
    }

    // Atomic claim to prevent double-send if two cron runs overlap
    const { data: claimed } = await supabase
      .from("sales")
      .update({ meta_event_sent: true })
      .eq("id", sale.id)
      .or("meta_event_sent.is.null,meta_event_sent.eq.false")
      .select("id")
      .single()

    if (!claimed) continue // Another instance already claimed it

    // Get contact name and page slug for enriched CAPI data
    let contactName: string | undefined
    if (sale.phone) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("name")
        .eq("project_id", sale.project_id)
        .eq("phone", sale.phone)
        .single()
      contactName = contact?.name?.split(" ")[0] || undefined
    }

    let pageSlug: string | undefined
    if (sale.page_id) {
      const { data: page } = await supabase
        .from("pages")
        .select("slug")
        .eq("id", sale.page_id)
        .single()
      pageSlug = page?.slug || undefined
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta.lat"

    try {
      await sendMetaEvent({
        pixelId,
        accessToken,
        eventName: "Purchase",
        eventId: `purchase_${sale.id}`,
        eventTime: sale.created_at ? Math.floor(new Date(sale.created_at).getTime() / 1000) : undefined,
        userData: {
          phone: sale.phone || undefined,
          client_ip_address: sale.visitor_ip || undefined,
          client_user_agent: sale.visitor_ua || undefined,
          external_id: sale.visitor_session_id || sale.id,
          fbp: sale.visitor_fbp || undefined,
          fbc: sale.visitor_fbc || undefined,
          country: "ar",
          fn: contactName,
        },
        customData: {
          value: sale.amount ?? 0,
          currency: "ARS",
          content_name: proj?.name || "",
          content_type: "product",
          ref_code: sale.ref_code || undefined,
        },
        sourceUrl: pageSlug ? `${appUrl}/s/${pageSlug}` : appUrl,
      })
      succeeded++
    } catch (err) {
      console.error(`[cron/retry-capi] Failed for sale ${sale.id}:`, err)
      // Reset so next run retries
      await supabase.from("sales").update({ meta_event_sent: false }).eq("id", sale.id)
      failed++
    }
  }

  console.log(`[cron/retry-capi] succeeded=${succeeded} failed=${failed}`)
  return NextResponse.json({ ok: true, retried: succeeded, failed })
}
