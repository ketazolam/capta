import Anthropic from "@anthropic-ai/sdk"

const client = new Anthropic()

export interface ComprobanteData {
  amount: number | null
  reference: string | null
  bank: string | null
  date: string | null
  recipient: string | null
  confidence: "high" | "medium" | "low"
  raw_text: string
}

// Domains allowed for comprobante image fetch — prevents SSRF
const ALLOWED_IMAGE_HOSTS = [
  "supabase.co",
  "supabase.in",
  "amazonaws.com",
  "googleusercontent.com",
  "cdn.whatsapp.net",
  "mmg.whatsapp.net",
  "pps.whatsapp.net",
  "media.whatsapp.net",
  "railway.app",
]

function isAllowedImageUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url)
    if (protocol !== "https:") return false
    return ALLOWED_IMAGE_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}

export async function analyzeComprobante(imageUrl: string): Promise<ComprobanteData> {
  if (!isAllowedImageUrl(imageUrl)) {
    throw new Error(`Image URL not allowed: ${imageUrl}`)
  }
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`)

  const contentType = imgRes.headers.get("content-type") || "image/jpeg"
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg"
  if (contentType.includes("png")) mediaType = "image/png"
  else if (contentType.includes("webp")) mediaType = "image/webp"

  const arrayBuffer = await imgRes.arrayBuffer()
  const imageBase64 = Buffer.from(arrayBuffer).toString("base64")

  const message = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBase64 },
          },
          {
            type: "text",
            text: `Analizá este comprobante de transferencia bancaria argentina y extraé los datos. Respondé ÚNICAMENTE con un JSON válido (sin texto adicional):

{
  "amount": 15000,
  "reference": "REF-123456",
  "bank": "Mercado Pago",
  "date": "2026-04-03",
  "recipient": "Juan García",
  "confidence": "high"
}

Reglas:
- "amount": monto numérico en ARS como número decimal (ej: 15000 o 15000.50). Sin separadores de miles. null si no visible.
- "reference": número/código de la transacción, CVU, CBU o referencia. null si no visible.
- "bank": banco o plataforma origen (Mercado Pago, Brubank, Galicia, Santander, etc.). null si no visible.
- "date": fecha en YYYY-MM-DD. null si no visible.
- "recipient": destinatario si visible, sino null.
- "confidence": "high" si los datos son claros, "medium" si hay dudas, "low" si es difícil leer.
Si NO es un comprobante bancario: {"amount":null,"reference":null,"bank":null,"date":null,"recipient":null,"confidence":"low"}`,
          },
        ],
      },
    ],
  })

  const rawText = message.content[0].type === "text" ? message.content[0].text : ""
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error("No JSON in Claude response")

  const parsed = JSON.parse(jsonMatch[0])
  return { ...parsed, raw_text: rawText }
}
