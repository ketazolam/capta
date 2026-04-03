import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) return NextResponse.json({ error: "imageUrl required" }, { status: 400 })

    // Fetch the image as base64
    let imageBase64: string
    let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg"

    try {
      const imgRes = await fetch(imageUrl)
      if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`)
      const contentType = imgRes.headers.get("content-type") || "image/jpeg"
      if (contentType.includes("png")) mediaType = "image/png"
      else if (contentType.includes("webp")) mediaType = "image/webp"
      const arrayBuffer = await imgRes.arrayBuffer()
      imageBase64 = Buffer.from(arrayBuffer).toString("base64")
    } catch (err) {
      return NextResponse.json({ error: "No se pudo cargar la imagen" }, { status: 400 })
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: imageBase64,
              },
            },
            {
              type: "text",
              text: `Analizá este comprobante de transferencia bancaria argentina y extraé los datos. Respondé ÚNICAMENTE con un JSON válido con este formato exacto (sin texto adicional):

{
  "amount": 15000,
  "reference": "REF-123456",
  "bank": "Banco Santander",
  "date": "2026-04-03",
  "recipient": "Juan García",
  "confidence": "high"
}

Reglas:
- "amount": número en ARS (solo dígitos, sin puntos ni comas)
- "reference": número/código de la transacción, CVU, CBU o referencia
- "bank": banco o plataforma origen (Mercado Pago, Brubank, Galicia, Santander, etc.)
- "date": fecha en formato YYYY-MM-DD
- "recipient": destinatario si es visible, sino null
- "confidence": "high" si los datos son claros, "medium" si hay dudas, "low" si es difícil leer
- Si un campo no está visible, usar null

Si la imagen NO es un comprobante bancario, devolvé: {"error": "No es un comprobante bancario válido"}`,
            },
          ],
        },
      ],
    })

    const rawText = message.content[0].type === "text" ? message.content[0].text : ""

    // Parse JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: "No se pudo extraer datos del comprobante" }, { status: 422 })
    }

    const extracted = JSON.parse(jsonMatch[0])
    if (extracted.error) {
      return NextResponse.json({ error: extracted.error }, { status: 422 })
    }

    return NextResponse.json({ ...extracted, raw_text: rawText })
  } catch (err) {
    console.error("[Analyze comprobante]", err)
    return NextResponse.json({ error: "Error al analizar el comprobante" }, { status: 500 })
  }
}
