import { createClient } from "@/lib/supabase/server"
import { ShoppingBag } from "lucide-react"

export default async function VentasPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: sales } = await supabase
    .from("sales")
    .select("*, contacts(name, phone)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white">Ventas</h2>
      </div>

      {!sales || sales.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
          <ShoppingBag className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">No hay ventas todavía</h3>
          <p className="text-zinc-600 text-sm mt-1">Cuando recibas comprobantes, aparecerán acá</p>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50">
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Cliente</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Monto</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Referencia</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Estado</th>
                <th className="text-left px-4 py-3 text-zinc-500 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                  <td className="px-4 py-3 text-white">
                    {(sale.contacts as { name?: string; phone?: string } | null)?.name ||
                      (sale.contacts as { name?: string; phone?: string } | null)?.phone ||
                      "—"}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 font-medium">
                    {sale.amount
                      ? `$${Number(sale.amount).toLocaleString("es-AR")}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{sale.reference || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      sale.status === "confirmed"
                        ? "bg-emerald-500/15 text-emerald-400"
                        : sale.status === "rejected"
                        ? "bg-red-500/15 text-red-400"
                        : "bg-yellow-500/15 text-yellow-400"
                    }`}>
                      {sale.status === "confirmed" ? "Confirmada" : sale.status === "rejected" ? "Rechazada" : "Pendiente"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(sale.created_at).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
