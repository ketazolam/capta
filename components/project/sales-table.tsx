"use client"

import { useState } from "react"
import SaleDetailDrawer from "./sale-detail-drawer"

interface Sale {
  id: string
  phone: string | null
  amount: number | null
  status: string
  reference: string | null
  image_url?: string | null
  ref_code?: string | null
  reject_reason?: string | null
  created_at: string
  contacts: { name?: string; phone?: string } | null
}

interface Props {
  sales: Sale[]
  projectId: string
  hasRefCode: boolean
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  rejected: "bg-red-500/15 text-red-400",
}

export default function SalesTable({ sales, projectId, hasRefCode }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <>
      <div className="border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Monto</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Estado</th>
              {hasRefCode && <th className="text-left px-4 py-3 text-zinc-500 font-medium">Campaña</th>}
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Comprobante</th>
              <th className="text-left px-4 py-3 text-zinc-500 font-medium">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => {
              const contact = sale.contacts
              const isRejected = sale.status === "rejected"
              return (
                <tr
                  key={sale.id}
                  onClick={() => setSelectedId(sale.id)}
                  className={`border-b border-zinc-800/50 hover:bg-zinc-900/40 cursor-pointer transition-colors align-middle ${isRejected ? "opacity-60" : ""}`}
                >
                  <td className={`px-4 py-3 ${isRejected ? "line-through text-zinc-500" : "text-white"}`}>
                    <div>{contact?.name || sale.phone || "—"}</div>
                    {contact?.name && sale.phone && (
                      <div className="text-zinc-500 text-xs">{sale.phone}</div>
                    )}
                  </td>
                  <td className={`px-4 py-3 font-medium ${isRejected ? "line-through text-red-400/60" : "text-emerald-400"}`}>
                    {sale.amount ? `$${Number(sale.amount).toLocaleString("es-AR")}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sale.status] || ""}`}>
                      {sale.status === "confirmed" ? "Confirmada" : sale.status === "pending" ? "Pendiente" : "Rechazada"}
                    </span>
                  </td>
                  {hasRefCode && (
                    <td className="px-4 py-3">
                      {sale.ref_code ? (
                        <span className="inline-block px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-300">{sale.ref_code}</span>
                      ) : "—"}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {sale.image_url ? (
                      <img
                        src={sale.image_url}
                        alt="comprobante"
                        className="max-w-[40px] max-h-[40px] object-contain rounded border border-zinc-700"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(sale.created_at).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <SaleDetailDrawer
        saleId={selectedId}
        projectId={projectId}
        onClose={() => setSelectedId(null)}
      />
    </>
  )
}
