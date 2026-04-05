import { createClient } from "@/lib/supabase/server"
import { ShoppingBag } from "lucide-react"
import Link from "next/link"
import Pagination from "@/components/ui/pagination"
import ExportCsvButton from "@/components/ui/export-csv-button"
import SalesTable from "@/components/project/sales-table"

const PAGE_SIZE = 25

function getDateRange(range: string): Date | null {
  const now = new Date()
  switch (range) {
    case "today": {
      const d = new Date(now); d.setUTCHours(0, 0, 0, 0); return d
    }
    case "7d":  return new Date(now.getTime() - 7  * 86400000)
    case "30d": return new Date(now.getTime() - 30 * 86400000)
    default: return null // "all"
  }
}

const STATUS_LABELS: Record<string, string> = {
  all: "Todas",
  pending: "Pendientes",
  confirmed: "Confirmadas",
  rejected: "Rechazadas",
}

export default async function VentasPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string; status?: string; range?: string; q?: string }>
}) {
  const { projectId } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || "1"))
  const statusFilter = sp.status || "all"
  const rangeFilter = sp.range || "all"
  const q = sp.q?.trim() || ""
  const supabase = await createClient()

  const since = getDateRange(rangeFilter)

  let countQ = supabase
    .from("sales")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)

  let dataQ = supabase
    .from("sales")
    .select("*, contacts(name, phone)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (statusFilter !== "all") {
    countQ = countQ.eq("status", statusFilter)
    dataQ = dataQ.eq("status", statusFilter)
  }
  if (since) {
    countQ = countQ.gte("created_at", since.toISOString())
    dataQ = dataQ.gte("created_at", since.toISOString())
  }
  if (q) {
    dataQ = dataQ.ilike("phone", `%${q}%`)
    countQ = countQ.ilike("phone", `%${q}%`)
  }

  const [{ count }, { data: sales }] = await Promise.all([countQ, dataQ])

  const hasRefCode = sales?.some((s) => (s as Record<string, unknown>).ref_code) ?? false

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const baseUrl = `/project/${projectId}/ventas`
  const buildUrl = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ status: statusFilter, range: rangeFilter, ...(q && { q }), ...extra })
    return `${baseUrl}?${p}`
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Ventas</h2>
        <div className="flex items-center gap-3">
          <ExportCsvButton
            href={`/api/projects/${projectId}/export/ventas?range=${rangeFilter}&status=${statusFilter}`}
          />
          <span className="text-zinc-500 text-sm">{count ?? 0} ventas</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <div className="flex gap-1">
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <Link
              key={val}
              href={buildUrl({ status: val, page: "1" })}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                statusFilter === val
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-medium"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex gap-1 border-l border-zinc-800 pl-2">
          {[["all", "Todas"], ["today", "Hoy"], ["7d", "7d"], ["30d", "30d"]].map(([val, label]) => (
            <Link
              key={val}
              href={buildUrl({ range: val, page: "1" })}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                rangeFilter === val
                  ? "bg-zinc-700 border-zinc-600 text-white font-medium"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <form method="get" action={baseUrl} className="flex gap-1">
          <input type="hidden" name="status" value={statusFilter} />
          <input type="hidden" name="range" value={rangeFilter} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar teléfono..."
            className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-44"
          />
        </form>
      </div>

      {!sales || sales.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
          <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">No hay ventas</h3>
          <p className="text-zinc-600 text-sm mt-1">
            {statusFilter !== "all" || rangeFilter !== "all" || q
              ? "Probá cambiando los filtros"
              : "Las ventas aparecen cuando un cliente confirma un pago"}
          </p>
        </div>
      ) : (
        <>
          <SalesTable
            sales={sales as never}
            projectId={projectId}
            hasRefCode={hasRefCode}
          />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={`${baseUrl}?status=${statusFilter}&range=${rangeFilter}${q ? `&q=${q}` : ""}&`}
          />
        </>
      )}
    </div>
  )
}
