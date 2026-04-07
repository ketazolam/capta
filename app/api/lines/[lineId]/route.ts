import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await params
  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 })
  }
  const supabase = await createClient()
  const { error } = await supabase.from("lines").update({ name: name.trim() }).eq("id", lineId)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ lineId: string }> }
) {
  const { lineId } = await params
  const supabase = await createClient()

  // Try to terminate Baileys session before deleting
  const baileysUrl = process.env.BAILEYS_URL
  if (baileysUrl) {
    try {
      await fetch(`${baileysUrl}/lines/${lineId}`, { method: "DELETE", signal: AbortSignal.timeout(8000) })
    } catch {
      // Non-fatal — still proceed with DB deletion
    }
  }

  // RLS policy "lines manage" ensures only admin/editor can delete
  const { error } = await supabase.from("lines").delete().eq("id", lineId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
