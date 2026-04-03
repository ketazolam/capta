interface MetaEventParams {
  pixelId: string
  accessToken: string
  eventName: string
  eventId: string
  userData?: {
    email?: string
    phone?: string
    client_ip_address?: string
    client_user_agent?: string
    fbp?: string
    fbc?: string
    external_id?: string
  }
  customData?: {
    value?: number
    currency?: string
    content_name?: string
    [key: string]: unknown
  }
  sourceUrl?: string
  testEventCode?: string
}

export async function sendMetaEvent(params: MetaEventParams) {
  const { pixelId, accessToken, eventName, eventId, userData, customData, sourceUrl, testEventCode } = params

  // test_event_code: use explicit param, or fall back to env var (for dev/staging testing)
  const resolvedTestCode = testEventCode || process.env.META_TEST_EVENT_CODE || undefined

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl,
        action_source: "website",
        user_data: {
          client_ip_address: userData?.client_ip_address,
          client_user_agent: userData?.client_user_agent,
          em: userData?.email ? [await hashSHA256(userData.email)] : undefined,
          ph: userData?.phone ? [await hashSHA256(normalizePhone(userData.phone))] : undefined,
          fbp: userData?.fbp,
          fbc: userData?.fbc,
          external_id: userData?.external_id ? [await hashSHA256(userData.external_id)] : undefined,
        },
        custom_data: customData,
      },
    ],
  }
  if (resolvedTestCode) payload.test_event_code = resolvedTestCode

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    )
    const json = await res.json()
    if (!res.ok) console.error("[Meta CAPI] Error:", json)
    return json
  } catch (err) {
    console.error("[Meta CAPI] Network error:", err)
  }
}

async function hashSHA256(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(value.trim().toLowerCase())
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, "")
  // Argentina E.164: 10 dígitos sin código país → prepend 54
  if (digits.length === 10 && !digits.startsWith("54")) {
    digits = "54" + digits
  }
  // 11 dígitos con 9 al inicio (celular sin código país) → prepend 54
  if (digits.length === 11 && digits.startsWith("9")) {
    digits = "54" + digits
  }
  return digits
}
