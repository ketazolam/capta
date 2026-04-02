import { createClient } from "@/lib/supabase/server"
import { BarChart2 } from "lucide-react"

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  // Get event counts by type for today
  const { data: events } = await supabase
    .from("events")
    .select("event_type, created_at")
    .eq("project_id", projectId)

  const counts = {
    page_view: 0,
    button_click: 0,
    conversation_start: 0,
    purchase: 0,
  }
  events?.forEach((e) => {
    if (e.event_type in counts) counts[e.event_type as keyof typeof counts]++
  })

  const funnel = [
    { label: "Visitas", value: counts.page_view, color: "bg-blue-500" },
    { label: "Clics", value: counts.button_click, color: "bg-violet-500" },
    { label: "Mensajes", value: counts.conversation_start, color: "bg-yellow-500" },
    { label: "Ventas", value: counts.purchase, color: "bg-emerald-500" },
  ]

  const hasData = Object.values(counts).some((v) => v > 0)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Analytics</h2>
        <div className="flex gap-1">
          {["Hoy", "15d", "30d", "90d"].map((label) => (
            <button
              key={label}
              className="px-3 py-1.5 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            >
              {label}
            </button>
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
      )}
    </div>
  )
}
