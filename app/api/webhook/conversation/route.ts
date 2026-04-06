import { createServiceClient } from "@/lib/supabase/server"
import { isRateLimited } from "@/lib/rate-limit"
import { verifyInternalSecret } from "@/lib/verify-secret"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  if (!verifyInternalSecret(req.headers.get("x-internal-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown"
  if (isRateLimited(ip, 30, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  const { project_id, phone, line_id, visit_code } = await req.json()

  if (!project_id || !phone) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  // Attribution: find the button_click that led to this conversation
  // Priority 1: exact match via LD visit code (e.g. "BK8FYPOD" matches session_id starting with "bk8fYpod")
  // Priority 2: most recent button_click on this line (fallback)
  let page_id: string | null = null
  let session_id: string | null = null
  if (line_id) {
    let matched = false
    if (visit_code) {
      const { data: exactClick } = await supabase
        .from("events")
        .select("page_id, session_id")
        .eq("line_id", line_id)
        .eq("event_type", "button_click")
        .ilike("session_id", `${visit_code}%`)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      if (exactClick) {
        page_id = exactClick.page_id
        session_id = exactClick.session_id
        matched = true
      }
    }
    if (!matched) {
      const fortyEightHAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      const { data: recentClick } = await supabase
        .from("events")
        .select("page_id, session_id")
        .eq("line_id", line_id)
        .eq("event_type", "button_click")
        .gte("created_at", fortyEightHAgo)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()
      page_id = recentClick?.page_id ?? null
      session_id = recentClick?.session_id ?? null
    }
  }

  await supabase.from("events").insert({
    project_id,
    page_id,
    line_id: line_id || null,
    event_type: "conversation_start",
    session_id,
    phone,
  })

  await supabase.from("contacts").upsert(
    {
      project_id,
      phone,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "project_id,phone" }
  )

  return NextResponse.json({ ok: true })
}
