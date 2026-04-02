import { createClient } from "@/lib/supabase/server"
import { BarChart2 } from "lucide-react"
import Link from "next/link"

function getDateRange(range: string): Date {
  const now = new Date()
  switch (range) {
    case "15d": return new Date(now.getTime() - 15 * 86400000)
    case "30d": return new Date(now.getTime() - 30 * 86400000)
    case "90d": return new Date(now.getTime() - 90 * 86400000)
    default: { // "today"
      const start = new Date(now)
      start.setHours(0, 0, 0, 0)
      return start
    }
  }
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ range?: string }>
}) {
  const { projectId } = await params
  const sp = await searchParams
  const range = sp.range || "30d"
  const supabase = await createClient()

  const since = getDateRange(range)

  // Get event counts by type for the selected period
  const { data: events } = await supabase
    .from("events")
    .select("event_type, created_at")
    .eq("project_id", projectId)
    .gte("created_at", since.toISOString())

  const counts = {
    page_view: 0,
    button_click: 0,
    conversation_start: 0,
    purchase: 0,
  }
  events?.forEach((e) => {
    if (e.event_type in counts) counts[e.event_type as keyof typeof counts]++
  })

  // Get total sales amount for the period
  const { data: sales } = await supabase
    .from("sales")
    .select("amount")
    .eq("project_id", projectId)
    .eq("status", "confirmed")
    .gte("created_at", since.toISOString())

  const totalRevenue = sales?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) ?? 0

  const funnel = [
    { label: "Visitas", value: counts.page_view, color: "bg-blue-500" },
    { label: "Clics", value: counts.button_click, color: "bg-violet-500" },
    { label: "Mensajes", value: counts.conversation_start, color: "bg-yellow-500" },
    { label: "Ventas", value: counts.purchase, color: "bg-emerald-500" },
  ]

  const hasData = Object.values(counts).some((v) => v > 0)

  const ranges = [
    { label: "Hoy", value: "today" },
    { label: "15d", value: "15d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
  ]

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <Link
              key={r.value}
              href={`/project/${projectId}/analytics?range=${r.value}`}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                range === r.value
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-medium"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
          <BarChart2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">Esperando datos de eventos</h3>
          <p className="text-zinc-600 text-sm mt-1">Recibí tráfico para ver analytics</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue card */}
          {totalRevenue > 0 && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <p className="text-zinc-500 text-sm mb-1">Facturación confirmada</p>
              <p className="text-3xl font-bold text-emerald-400">
                ${totalRevenue.toLocaleString("es-AR")}
              </p>
              <p className="text-xs text-zinc-600 mt-1">{sales?.length} ventas confirmadas</p>
            </div>
          )}

          {/* Funnel cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {funnel.map((item) => {
              const prev = funnel[funnel.indexOf(item) - 1]
              const rate = prev && prev.value > 0
                ? Math.round((item.value / prev.value) * 100)
                : null
              return (
                <div key={item.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <p className="text-zinc-500 text-sm mb-2">{item.label}</p>
                  <p className="text-3xl font-bold text-white">{item.value.toLocaleString("es-AR")}</p>
                  {rate !== null && (
                    <p className="text-xs text-zinc-600 mt-1">{rate}% conversión</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
