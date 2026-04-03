import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const { pageId } = await params
  const supabase = await createClient()

  // RLS policy "pages manage" ensures only admin/editor can delete
  const { error } = await supabase.from("pages").delete().eq("id", pageId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
