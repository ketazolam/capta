import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lineId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lineId } = await params

  const baileysUrl = process.env.BAILEYS_URL
  if (!baileysUrl) return NextResponse.json({ error: "BAILEYS_URL not configured" }, { status: 500 })

  try {
    const res = await fetch(`${baileysUrl}/lines/${lineId}/qr`)
    if (res.status === 204) return NextResponse.json({ qr: null, status: "pending" })
    if (res.status === 404) return NextResponse.json({ qr: null, status: "not_started" })
    const json = await res.json()
    return NextResponse.json(json, { status: res.status })
  } catch {
    return NextResponse.json({ error: "Baileys server unreachable" }, { status: 502 })
  }
}
