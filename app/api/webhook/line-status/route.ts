import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// Baileys calls this endpoint when a line connects or disconnects.
// Payload: { lineId: string, status: "connected" | "disconnected", phone?: string }
// Secured by INTERNAL_SECRET header.

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal-secret")
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { lineId, status, phone } = body as {
    lineId: string
    status: "connected" | "disconnected"
    phone?: string
  }

  if (!lineId || !["connected", "disconnected"].includes(status)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const supabase = await createServiceClient()

  const update: Record<string, unknown> = { status }
  if (status === "connected" && phone) {
    update.phone_number = phone
  }

  const { error } = await supabase
    .from("lines")
    .update(update)
    .eq("id", lineId)

  if (error) {
    console.error("[line-status webhook]", error)
    return NextResponse.json({ error: "DB update failed" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
