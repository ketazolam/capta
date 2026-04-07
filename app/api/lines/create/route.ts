import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { projectId, name } = await req.json()
  if (!projectId || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Verify user has access to project
  const { data: project } = await supabase
    .from("projects")
    .select("id, org_id")
    .eq("id", projectId)
    .maybeSingle()

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

  // Create line
  const { data: line, error } = await supabase
    .from("lines")
    .insert({
      project_id: projectId,
      name,
      status: "disconnected",
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Start Baileys session
  const baileysUrl = process.env.BAILEYS_URL
  if (baileysUrl) {
    await fetch(`${baileysUrl}/lines/${line.id}/start`, {
      method: "POST",
      headers: process.env.INTERNAL_SECRET ? { "x-internal-secret": process.env.INTERNAL_SECRET } : {},
      signal: AbortSignal.timeout(8000),
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, line })
}
