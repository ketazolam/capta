import { NextRequest, NextResponse } from "next/server"
import { analyzeComprobante } from "@/lib/comprobante"

export async function POST(req: NextRequest) {
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
