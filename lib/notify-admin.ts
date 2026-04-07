/** Sends a Telegram notification to the configured group when a comprobante arrives. Non-fatal — never throws. */
export async function notifyAdmin(opts: {
  message: string
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) return
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: opts.message, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    console.error("[notify-admin] Telegram failed:", (err as Error).message)
    // Non-fatal — never throw
  }
}
