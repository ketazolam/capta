import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { sendMetaEvent } from "@/lib/meta-capi"
import { nanoid } from "nanoid"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { event_type, project_id, page_id, line_id, session_id, phone, ref_code } = body

    const supabase = await createServiceClient()
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || ""
    const userAgent = req.headers.get("user-agent") || ""

    // Insert event
    await supabase.from("events").insert({
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

    // Get page pixel config
    const { data: page } = await supabase
      .from("pages")
      .select("meta_pixel_id, meta_access_token")
      .eq("id", page_id)
      .single()

    if (page?.meta_pixel_id && page?.meta_access_token) {
      const metaEventMap: Record<string, string> = {
        page_view: "PageView",
        button_click: "Lead",
        conversation_start: "InitiateCheckout",
        purchase: "Purchase",
      }

      const metaEventName = metaEventMap[event_type]
      if (metaEventName) {
        await sendMetaEvent({
          pixelId: page.meta_pixel_id,
          accessToken: page.meta_access_token,
          eventName: metaEventName,
          eventId: nanoid(),
          userData: {
            phone,
            client_ip_address: ip,
            client_user_agent: userAgent,
          },
          sourceUrl: req.headers.get("referer") || undefined,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[Events API]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
