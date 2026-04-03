import { createClient } from "@/lib/supabase/server"
import { Users } from "lucide-react"
import Link from "next/link"
import Pagination from "@/components/ui/pagination"
import ExportCsvButton from "@/components/ui/export-csv-button"

const PAGE_SIZE = 25

export default async function ContactosPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string; q?: string; sort?: string }>
}) {
  const { projectId } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || "1"))
  const q = sp.q?.trim() || ""
  const sort = sp.sort || "purchases"
  const supabase = await createClient()

  const orderCol = sort === "recent" ? "last_seen_at" : "total_purchases"

  let countQ = supabase
    .from("contacts")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId)

  let dataQ = supabase
    .from("contacts")
    .select("*")
    .eq("project_id", projectId)
    .order(orderCol, { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (q) {
    const likeQ = `%${q}%`
    countQ = countQ.or(`phone.ilike.${likeQ},name.ilike.${likeQ}`)
    dataQ = dataQ.or(`phone.ilike.${likeQ},name.ilike.${likeQ}`)
  }

  const [{ count }, { data: contacts }] = await Promise.all([countQ, dataQ])

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const baseUrl = `/project/${projectId}/contactos`
  const buildUrl = (extra: Record<string, string>) => {
    const p = new URLSearchParams({ sort, ...(q && { q }), ...extra })
    return `${baseUrl}?${p}`
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Contactos</h2>
        <div className="flex items-center gap-3">
          <ExportCsvButton
            href={`/api/projects/${projectId}/export/contactos`}
          />
          <span className="text-zinc-500 text-sm">{count ?? 0} contactos</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {/* Sort */}
        <div className="flex gap-1">
          {[["purchases", "Mayor gasto"], ["recent", "Más recientes"]].map(([val, label]) => (
            <Link
              key={val}
              href={buildUrl({ sort: val, page: "1" })}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                sort === val
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-medium"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form method="get" action={baseUrl} className="flex gap-1">
          <input type="hidden" name="sort" value={sort} />
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar nombre o teléfono..."
            className="px-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-52"
          />
        </form>
      </div>

      {!contacts || contacts.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
          <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">
            {q ? `Sin resultados para "${q}"` : "No hay contactos"}
          </h3>
          <p className="text-zinc-600 text-sm mt-1 mb-4">
            {q
              ? "Probá con otro término de búsqueda"
              : "Los contactos se crean automáticamente cuando alguien inicia una conversación"}
          </p>
          {!q && (
            <Link
              href={`/project/${projectId}/paginas`}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              Crear una página →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Contacto</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Teléfono</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Total compras</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Compras</th>
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium">Visto</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td className="px-4 py-3 text-white">{contact.name || "Sin nombre"}</td>
                    <td className="px-4 py-3 text-zinc-400">{contact.phone}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium">
                      {contact.total_purchases > 0
                        ? `$${Number(contact.total_purchases).toLocaleString("es-AR")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{contact.purchase_count}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs">
                      {contact.last_seen_at ? new Date(contact.last_seen_at).toLocaleDateString("es-AR") : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl={`${baseUrl}?sort=${sort}${q ? `&q=${q}` : ""}&`}
          />
        </>
      )}
    </div>
  )
}
