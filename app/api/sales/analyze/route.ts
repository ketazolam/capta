import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { analyzeComprobante } from "@/lib/comprobante"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 })

    const data = await analyzeComprobante(imageUrl)
    return NextResponse.json(data)
  } catch (err) {
    console.error("[Analyze comprobante]", err)
    return NextResponse.json({ error: "Error al analizar el comprobante" }, { status: 500 })
  }
}
