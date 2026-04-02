import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, pixelId } = await req.json()
  if (!projectId || !pixelId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const { error } = await supabase
    .from("projects")
    .update({ meta_pixel_id: pixelId })
    .eq("id", projectId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
