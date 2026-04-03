import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_type, project_id, page_id, line_id, session_id, phone, ref_code, fbp, fbc, source_url } = body

    const supabase = await createServiceClient()
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || ""
    const userAgent = req.headers.get("user-agent") || ""

    // Insert event — check for errors
    const { error: insertError } = await supabase.from("events").insert({
      project_id,
      page_id,
      line_id,
      event_type,
      session_id,
      phone,
      ip,
      user_agent: userAgent,
      ref_code,
    })

    if (insertError) {
      console.error("[Events API] insert error:", insertError)
      return NextResponse.json({ error: "Failed to insert event" }, { status: 500 })
    }

    // Auto-create/update contact on conversation_start
    if (event_type === "conversation_start" && phone && project_id) {
      await supabase.from("contacts").upsert(
        { project_id, phone, last_seen_at: new Date().toISOString() },
        { onConflict: "project_id,phone", ignoreDuplicates: false }
      )
    }

    // Get pixel config — try page-level first, then project-level
    let pixelId: string | null = null
    let accessToken: string | null = null

    if (page_id) {
      const { data: page } = await supabase
        .from("pages")
        .select("meta_pixel_id, meta_access_token")
        .eq("id", page_id)
        .single()
      pixelId = page?.meta_pixel_id ?? null
      accessToken = page?.meta_access_token ?? null
    }

    // Fall back to project-level config (columns may not exist yet)
    let metaEnabled = true
    if ((!pixelId || !accessToken) && project_id) {
      try {
        const { data: proj } = await supabase
          .from("projects")
          .select("meta_pixel_id, meta_access_token, attribution_config")
          .eq("id", project_id)
          .single()
        if (proj?.meta_pixel_id && proj?.meta_access_token) {
          pixelId = proj.meta_pixel_id
          accessToken = proj.meta_access_token
        }
        if (proj?.attribution_config?.meta) {
          metaEnabled = proj.attribution_config.meta[event_type] !== false
        }
      } catch (err) {
        console.error("[Events API] project config fetch error:", err)
      }
    } else if (project_id) {
      // Pixel config came from page-level, still check project attribution config
      try {
        const { data: proj } = await supabase
          .from("projects")
          .select("attribution_config")
          .eq("id", project_id)
          .single()
        if (proj?.attribution_config?.meta) {
          metaEnabled = proj.attribution_config.meta[event_type] !== false
        }
      } catch (err) {
        console.error("[Events API] attribution config fetch error:", err)
      }
    }

    if (pixelId && accessToken && metaEnabled) {
      // page_view is fired server-side in /s/[slug]/page.tsx — skip here to avoid duplicates
      const metaEventMap: Record<string, string> = {
        button_click: "Lead",
        conversation_start: "InitiateCheckout",
        purchase: "Purchase",
      }

      const metaEventName = metaEventMap[event_type]
      if (metaEventName) {
        await sendMetaEvent({
          pixelId,
          accessToken,
          eventName: metaEventName,
          eventId: `${event_type}_${session_id}`,
          userData: {
            phone,
            client_ip_address: ip,
            client_user_agent: userAgent,
            fbp: fbp || undefined,
            fbc: fbc || undefined,
            external_id: session_id || undefined,
          },
          sourceUrl: source_url || req.headers.get("referer") || undefined,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Events API]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
