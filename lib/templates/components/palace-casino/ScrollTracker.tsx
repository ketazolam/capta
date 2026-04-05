"use client"

import { useEffect, useRef } from "react"
import { useTracking } from "@/lib/templates/tracking-context"

export default function ScrollTracker() {
  const { trackEvent, sessionId } = useTracking()
  const has50Tracked = useRef(false)
  const has90Tracked = useRef(false)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = (scrollTop / docHeight) * 100

      if (scrollPercent >= 50 && !has50Tracked.current) {
        has50Tracked.current = true
        trackEvent("view_content")
        // Dual-fire browser pixel for dedup with CAPI (same pattern as Lead)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (typeof window !== "undefined" && (window as any).fbq) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(window as any).fbq("track", "ViewContent", {}, { eventID: `view_content_${sessionId}` })
        }
      }

      if (scrollPercent >= 90 && !has90Tracked.current) {
        has90Tracked.current = true
        trackEvent("high_engagement")
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [trackEvent])

  return null
}
