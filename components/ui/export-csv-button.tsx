"use client"

import { Download } from "lucide-react"
import { useState } from "react"

export default function ExportCsvButton({
  href,
  label = "Exportar CSV",
}: {
  href: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const res = await fetch(href)
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const disposition = res.headers.get("Content-Disposition")
      const match = disposition?.match(/filename="(.+)"/)
      a.download = match?.[1] || "export.csv"
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors disabled:opacity-50"
    >
      <Download className="w-3.5 h-3.5" />
      {loading ? "Exportando..." : label}
    </button>
  )
}
