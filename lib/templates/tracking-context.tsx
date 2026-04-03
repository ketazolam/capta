"use client"

import { createContext, useCallback, useContext } from "react"

interface TrackingContextValue {
  pageId: string
  projectId: string
  sessionId: string
  lineId: string | null
  waPhone: string | null
  waMessage: string
}

const TrackingContext = createContext<TrackingContextValue | null>(null)

export function TrackingProvider({
  children,
  ...value
}: TrackingContextValue & { children: React.ReactNode }) {
  return <TrackingContext.Provider value={value}>{children}</TrackingContext.Provider>
}

export function useTracking() {
  const ctx = useContext(TrackingContext)
  if (!ctx) throw new Error("useTracking must be used inside TrackingProvider")

  const { pageId, projectId, sessionId, lineId, waPhone, waMessage } = ctx

  const waUrl = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(waMessage)}`
    : null

  const trackEvent = useCallback(
    async (eventType: string, extra?: Record<string, unknown>) => {
      try {
        await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            page_id: pageId,
            line_id: lineId,
            event_type: eventType,
            session_id: sessionId,
            ...extra,
          }),
        })
      } catch (err) {
        console.error("[tracking] event error:", err)
      }
    },
    [projectId, pageId, lineId, sessionId]
  )

  const redirectToWhatsApp = useCallback(async () => {
    try {
      await trackEvent("button_click")
      if (waUrl) {
        await trackEvent("conversation_start", { phone: waPhone })
      }
    } catch (err) {
      console.error("[tracking] redirect tracking error:", err)
    } finally {
      if (waUrl) window.location.href = waUrl
    }
  }, [trackEvent, waUrl, waPhone])

  return { trackEvent, redirectToWhatsApp, waUrl, waPhone }
}
