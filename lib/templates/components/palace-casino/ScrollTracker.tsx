"use client"

import { useEffect, useRef } from "react"
import { useTracking } from "@/lib/templates/tracking-context"

export default function ScrollTracker() {
  const { trackEvent } = useTracking()
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
