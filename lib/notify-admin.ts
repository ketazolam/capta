/** Sends a WhatsApp notification to the project's notification_phone via Baileys.
 *  Uses the specified line to send the message. Non-fatal — never throws. */
export async function notifyAdmin(opts: {
  lineId: string
  notificationPhone: string
  message: string
}): Promise<void> {
  const baileysUrl = process.env.BAILEYS_URL
  const secret = process.env.INTERNAL_SECRET
  if (!baileysUrl || !opts.notificationPhone) return
  try {
    await fetch(`${baileysUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": secret || "",
      },
      body: JSON.stringify({
        lineId: opts.lineId,
        to: opts.notificationPhone,
        text: opts.message,
      }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // Non-fatal — never throw
  }
}
