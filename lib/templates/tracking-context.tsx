"use client"

import { createContext, useCallback, useContext } from "react"

interface TrackingContextValue {
  pageId: string
  projectId: string
  sessionId: string
  lineId: string | null
  waPhone: string | null
  waMessage: string
  fbp?: string
  fbc?: string
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

  const { fbp, fbc } = ctx

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
            fbp,
            fbc,
            source_url: window.location.href,
            ...extra,
          }),
        })
      } catch (err) {
        console.error("[tracking] event error:", err)
      }
    },
    [projectId, pageId, lineId, sessionId, fbp, fbc]
  )

  const redirectToWhatsApp = useCallback(async () => {
    try {
      // Read _fbp from document.cookie at click time — more accurate than server-side read
      // (browser pixel sets _fbp after page load, so server-side value may be null on first visit)
      const liveFbp = document.cookie.match(/(?:^|;\s*)_fbp=([^;]+)/)?.[1] ?? fbp ?? undefined
      const liveFbc = document.cookie.match(/(?:^|;\s*)_fbc=([^;]+)/)?.[1] ?? fbc ?? undefined

      await trackEvent("button_click", { fbp: liveFbp, fbc: liveFbc })
      // Dedup browser pixel Lead with same eventId as CAPI
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof window !== "undefined" && (window as any).fbq) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(window as any).fbq("track", "Lead", {}, { eventID: `button_click_${sessionId}` })
      }
    } catch (err) {
      console.error("[tracking] redirect tracking error:", err)
    } finally {
      // Delay redirect 300ms to let the browser pixel beacon (fbq Lead GET) complete
      // before navigating away — otherwise the browser cancels the inflight request
      if (waUrl) setTimeout(() => { window.location.href = waUrl }, 300)
    }
  }, [trackEvent, waUrl, sessionId, fbp, fbc])

  return { trackEvent, redirectToWhatsApp, waUrl, waPhone, sessionId }
}
