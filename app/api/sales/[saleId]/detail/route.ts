import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ saleId: string }> }
) {
  const { saleId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: sale, error } = await supabase
    .from("sales")
    .select("id, amount, status, image_url, raw_text, reference, reject_reason, ref_code, meta_event_sent, visitor_fbp, visitor_fbc, visitor_ip, visitor_ua, visitor_session_id, page_id, phone, project_id, created_at, contacts(id, name, phone, total_purchases, purchase_count)")
    .eq("id", saleId)
    .maybeSingle()

  if (error || !sale) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Fetch related events by session_id if available
  let events: unknown[] = []
  if (sale.visitor_session_id) {
    const { data } = await supabase
      .from("events")
      .select("id, event_type, created_at, session_id, fbp, fbc, ip, page_id")
      .eq("session_id", sale.visitor_session_id)
      .order("created_at", { ascending: true })
    events = data ?? []
  }

  return NextResponse.json({ sale, events })
}
