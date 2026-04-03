/**
 * capta.js — Tracking script for external pages
 * Usage: <script src="https://capta-eight.vercel.app/capta.js" data-tracking-id="YOUR_ID" defer></script>
 *
 * Exposes window.capta.track(eventType, extra) and window.capta.trackClick(phone, message)
 * Only tracks for Capta internal analytics — does NOT fire Meta CAPI (keep your own Meta Pixel).
 */
(function () {
  var script = document.currentScript
  if (!script) return

  var trackingId = script.getAttribute("data-tracking-id")
  if (!trackingId) return

  var endpoint = script.src.replace(/\/capta\.js(\?.*)?$/, "/api/events")

  // Session ID: persists within the browser tab session
  var SID_KEY = "_capta_sid"
  var sid = (function () {
    try {
      var stored = sessionStorage.getItem(SID_KEY)
      if (stored) return stored
      var id = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
      sessionStorage.setItem(SID_KEY, id)
      return id
    } catch (_) {
      return Math.random().toString(36).slice(2)
    }
  })()

  function send(eventType, extra) {
    var payload = Object.assign(
      {
        tracking_id: trackingId,
        event_type: eventType,
        session_id: sid,
        source_url: location.href,
      },
      extra || {}
    )
    var body = JSON.stringify(payload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }))
    } else {
      fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: body, keepalive: true }).catch(function () {})
    }
  }

  // Auto page_view on load
  send("page_view")

  // Public API
  window.capta = {
    track: send,
    trackClick: function (phone, message) {
      send("button_click")
      var url = "https://wa.me/" + phone + (message ? "?text=" + encodeURIComponent(message) : "")
      location.href = url
    },
  }
})()
