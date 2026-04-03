import { createClient } from "@/lib/supabase/server"
import { Users } from "lucide-react"
import Link from "next/link"
import Pagination from "@/components/ui/pagination"

const PAGE_SIZE = 25

export default async function ContactosPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { projectId } = await params
  const sp = await searchParams
  const page = Math.max(1, parseInt(sp.page || "1"))
  const supabase = await createClient()

  const [{ count }, { data: contacts }] = await Promise.all([
    supabase
      .from("contacts")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId),
    supabase
      .from("contacts")
      .select("*")
      .eq("project_id", projectId)
      .order("total_purchases", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
  ])

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)
  const baseUrl = `/project/${projectId}/contactos`

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Contactos</h2>
        <span className="text-zinc-500 text-sm">{count ?? 0} contactos</span>
      </div>

      {!contacts || contacts.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
          <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">No hay contactos</h3>
          <p className="text-zinc-600 text-sm mt-1 mb-4">Los contactos se crean automáticamente cuando alguien inicia una conversación desde tus Smart Links</p>
          <Link
            href={`/project/${projectId}/paginas`}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            Crear una página →
          </Link>
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
                      {new Date(contact.last_seen_at).toLocaleDateString("es-AR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} baseUrl={baseUrl} />
        </>
      )}
    </div>
  )
}
