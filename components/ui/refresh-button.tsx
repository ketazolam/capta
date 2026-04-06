"use client"

import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function RefreshButton({ loadedAt }: { loadedAt: number }) {
  const router = useRouter()
  const [refreshing, setRefreshing] = useState(false)

  const elapsed = Math.floor((Date.now() - loadedAt) / 1000)
  const label =
    elapsed < 60
      ? `hace ${elapsed}s`
      : elapsed < 3600
        ? `hace ${Math.floor(elapsed / 60)}min`
        : `hace ${Math.floor(elapsed / 3600)}h`

  async function handleRefresh() {
    setRefreshing(true)
    router.refresh()
    // Small delay so the icon spins visibly
    setTimeout(() => setRefreshing(false), 800)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={refreshing}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
      title="Actualizar datos"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
      {label}
    </button>
  )
}
