import { createClient } from "@/lib/supabase/server"
import { BarChart2, FileText, Settings } from "lucide-react"
import Link from "next/link"
import AnalyticsChart from "@/components/project/analytics-chart"

function getDateRange(range: string): Date {
  const now = new Date()
  switch (range) {
    case "15d": return new Date(now.getTime() - 15 * 86400000)
    case "30d": return new Date(now.getTime() - 30 * 86400000)
    case "90d": return new Date(now.getTime() - 90 * 86400000)
    default: { // "today"
      const start = new Date(now)
      start.setUTCHours(0, 0, 0, 0)
      return start
    }
  }
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ range?: string; page_id?: string }>
}) {
  const { projectId } = await params
  const sp = await searchParams
  const range = sp.range || "30d"
  const pageFilter = sp.page_id || null
  const supabase = await createClient()

  const since = getDateRange(range)
  const numDays = range === "today" ? 1 : range === "15d" ? 15 : range === "30d" ? 30 : 90

  const counts = { page_view: 0, button_click: 0, purchase: 0 }

  const dayMap: Record<string, typeof counts> = {}
  for (let i = numDays - 1; i >= 0; i--) {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - i)
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = { page_view: 0, button_click: 0, purchase: 0 }
  }

  // Fetch pages for the filter dropdown
  const { data: pages } = await supabase
    .from("pages")
    .select("id, name, slug")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  // RPC with optional page_id filter
  // Always include p_page_id (even null) to disambiguate the overloaded RPC function
  const rpcParams: Record<string, unknown> = {
    p_project_id: projectId,
    p_since: since.toISOString(),
    p_page_id: pageFilter || null,
  }

  const { data: rpcData, error: rpcError } = await supabase
    .rpc("get_analytics_summary", rpcParams)

  if (rpcData && !rpcError) {
    for (const row of rpcData) {
      const key = row.event_date as string
      if (row.event_type in counts) {
        counts[row.event_type as keyof typeof counts] += row.event_count
      }
      if (dayMap[key] && row.event_type in dayMap[key]) {
        dayMap[key][row.event_type as keyof typeof counts] += row.event_count
      }
    }
  } else {
    if (rpcError) console.error("[Analytics] RPC error, falling back:", rpcError)
    let q = supabase
      .from("events")
      .select("event_type, created_at")
      .eq("project_id", projectId)
      .gte("created_at", since.toISOString())
      .limit(50000)
    if (pageFilter) q = q.eq("page_id", pageFilter)
    const { data: events } = await q
    events?.forEach((e) => {
      if (e.event_type in counts) counts[e.event_type as keyof typeof counts]++
      const key = e.created_at.slice(0, 10)
      if (dayMap[key] && e.event_type in dayMap[key]) {
        dayMap[key][e.event_type as keyof typeof counts]++
      }
    })
  }

  const chartData = Object.entries(dayMap).map(([date, vals]) => ({ date, ...vals }))

  let salesQ = supabase
    .from("sales")
    .select("amount")
    .eq("project_id", projectId)
    .eq("status", "confirmed")
    .gte("created_at", since.toISOString())
  if (pageFilter) salesQ = salesQ.eq("page_id", pageFilter)
  const { data: sales } = await salesQ

  const totalRevenue = sales?.reduce((sum, s) => sum + (Number(s.amount) || 0), 0) ?? 0

  const funnel = [
    { label: "Visitas", value: counts.page_view,   color: "bg-blue-500" },
    { label: "Clics",   value: counts.button_click, color: "bg-violet-500" },
    { label: "Ventas",  value: counts.purchase,     color: "bg-emerald-500" },
  ]

  const hasData = Object.values(counts).some((v) => v > 0)
  const ranges = [
    { label: "Hoy", value: "today" },
    { label: "15d", value: "15d" },
    { label: "30d", value: "30d" },
    { label: "90d", value: "90d" },
  ]

  const buildUrl = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ range, ...(pageFilter && { page_id: pageFilter }), ...extra })
    return `/project/${projectId}/analytics?${p}`
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Analytics</h2>

        <div className="flex gap-2">
          {/* Page filter */}
          {pages && pages.length > 1 && (
            <div className="flex gap-1 border-r border-zinc-800 pr-2">
              <Link
                href={buildUrl({ page_id: "" })}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  !pageFilter
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-medium"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                Todas
              </Link>
              {pages.map((p) => (
                <Link
                  key={p.id}
                  href={buildUrl({ page_id: p.id })}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    pageFilter === p.id
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-medium"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {p.name || p.slug}
                </Link>
              ))}
            </div>
          )}

          {/* Range filter */}
          <div className="flex gap-1">
            {ranges.map((r) => (
              <Link
                key={r.value}
                href={buildUrl({ range: r.value })}
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
      </div>

      {!hasData ? (
        <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
          <BarChart2 className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">Esperando datos de eventos</h3>
          <p className="text-zinc-600 text-sm mt-1 mb-6">Publicá una página y empezá a recibir tráfico para ver analytics</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={`/project/${projectId}/paginas`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Crear una página
            </Link>
            <Link
              href={`/project/${projectId}/settings/general`}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configurar Meta Pixel
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-zinc-500 text-sm mb-1">Facturación confirmada</p>
            <p className="text-3xl font-bold text-emerald-400">
              ${totalRevenue.toLocaleString("es-AR")}
            </p>
            <p className="text-xs text-zinc-600 mt-1">{sales?.length ?? 0} ventas confirmadas</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
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

          <AnalyticsChart data={chartData} />
        </div>
      )}
    </div>
  )
}
