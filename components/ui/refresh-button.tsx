"use client"

import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"

const AUTO_REFRESH_MS = 30_000

export default function RefreshButton({ loadedAt }: { loadedAt: number }) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)
  const [lastLoaded, setLastLoaded] = useState(loadedAt)

  const doRefresh = useCallback(() => {
    setRefreshing(true)
    router.refresh()
    setLastLoaded(Date.now())
    setTimeout(() => setRefreshing(false), 800)
  }, [router])

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(doRefresh, AUTO_REFRESH_MS)
    return () => clearInterval(id)
  }, [doRefresh])

  const elapsed = Math.floor((Date.now() - lastLoaded) / 1000)
  const label =
    elapsed < 60
      ? `hace ${elapsed}s`
      : elapsed < 3600
        ? `hace ${Math.floor(elapsed / 60)}min`
        : `hace ${Math.floor(elapsed / 3600)}h`

  return (
    <button
      onClick={doRefresh}
      disabled={refreshing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
      title="Actualizar datos (auto cada 30s)"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
      {label}
    </button>
  )
}
