import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contactId: string }> }
) {
  const { contactId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: contact, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", contactId)
    .single()

  if (error || !contact) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [{ data: events }, { data: sales }] = await Promise.all([
    supabase
      .from("events")
      .select("id, event_type, created_at, session_id, fbp, fbc, ip, page_id")
      .eq("project_id", contact.project_id)
      .eq("phone", contact.phone)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("sales")
      .select("id, amount, status, image_url, reference, created_at, reject_reason, ref_code, meta_event_sent")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: false }),
  ])

  return NextResponse.json({ contact, events: events ?? [], sales: sales ?? [] })
}
