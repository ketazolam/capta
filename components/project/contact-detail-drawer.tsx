"use client"

import { useEffect, useState } from "react"
import { X, Phone, ShoppingBag, Activity, ExternalLink } from "lucide-react"

interface ContactDetail {
  contact: {
    id: string
    name: string | null
    phone: string
    total_purchases: number
    purchase_count: number
    created_at: string
    last_seen_at: string | null
  }
  events: Array<{
    id: string
    event_type: string
    created_at: string
    session_id: string | null
    fbp: string | null
    fbc: string | null
    ip: string | null
    page_id: string | null
  }>
  sales: Array<{
    id: string
    amount: number | null
    status: string
    image_url: string | null
    reference: string | null
    created_at: string
    reject_reason: string | null
    ref_code: string | null
    meta_event_sent: boolean | null
  }>
}

const EVENT_LABELS: Record<string, string> = {
  page_view: "Vista de página",
  button_click: "Click en CTA",
  purchase: "Compra",
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-400",
  pending: "bg-yellow-500/15 text-yellow-400",
  rejected: "bg-red-500/15 text-red-400",
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  rejected: "Rechazada",
}

interface Props {
  contactId: string | null
  onClose: () => void
}

export default function ContactDetailDrawer({ contactId, onClose }: Props) {
  const [data, setData] = useState<ContactDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!contactId) { setData(null); setError(false); return }
    setLoading(true)
    setError(false)
    fetch(`/api/contacts/${contactId}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [contactId])

  if (!contactId) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-800">
          {loading || !data ? (
            <div className="space-y-2">
              <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-28 bg-zinc-800 rounded animate-pulse" />
            </div>
          ) : (
            <div>
              <h2 className="text-white font-semibold text-lg">
                {data.contact.name || "Sin nombre"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-zinc-400 text-sm">{data.contact.phone}</span>
                <a
                  href={`https://wa.me/${data.contact.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors ml-4 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-3 gap-px bg-zinc-800 border-b border-zinc-800">
            <div className="bg-zinc-950 p-4 text-center">
              <p className="text-emerald-400 font-bold text-lg">
                {data.contact.total_purchases > 0
                  ? `$${Number(data.contact.total_purchases).toLocaleString("es-AR")}`
                  : "—"}
              </p>
              <p className="text-zinc-500 text-xs mt-0.5">Total compras</p>
            </div>
            <div className="bg-zinc-950 p-4 text-center">
              <p className="text-white font-bold text-lg">{data.contact.purchase_count}</p>
              <p className="text-zinc-500 text-xs mt-0.5">Compras</p>
            </div>
            <div className="bg-zinc-950 p-4 text-center">
              <p className="text-white font-bold text-lg">{data.events.length}</p>
              <p className="text-zinc-500 text-xs mt-0.5">Eventos</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <p className="text-zinc-500 text-sm">No se pudo cargar el contacto</p>
              <button onClick={() => { setError(false); setLoading(true); fetch(`/api/contacts/${contactId}`).then(r => r.json()).then(setData).catch(() => setError(true)).finally(() => setLoading(false)) }} className="mt-3 text-xs text-zinc-400 hover:text-white underline">Reintentar</button>
            </div>
          )}

          {data && (
            <div className="p-6 space-y-8">
              {/* Sales */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShoppingBag className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-zinc-300 font-medium text-sm">Ventas ({data.sales.length})</h3>
                </div>
                {data.sales.length === 0 ? (
                  <p className="text-zinc-600 text-sm">Sin ventas registradas</p>
                ) : (
                  <div className="space-y-2">
                    {data.sales.map((sale) => (
                      <div key={sale.id} className="flex items-center gap-3 bg-zinc-900 rounded-lg p-3 border border-zinc-800">
                        {sale.image_url ? (
                          <a href={sale.image_url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={sale.image_url}
                              alt="comprobante"
                              className="w-10 h-10 object-contain rounded border border-zinc-700 flex-shrink-0"
                            />
                          </a>
                        ) : (
                          <div className="w-10 h-10 rounded border border-zinc-700 bg-zinc-800 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-medium text-sm">
                              {sale.amount ? `$${Number(sale.amount).toLocaleString("es-AR")}` : "—"}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[sale.status] || ""}`}>
                              {STATUS_LABELS[sale.status] || sale.status}
                            </span>
                            {sale.meta_event_sent && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">CAPI ✓</span>
                            )}
                          </div>
                          <div className="text-zinc-500 text-xs mt-0.5 flex items-center gap-2">
                            <span>{new Date(sale.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}</span>
                            {sale.reference && <span>· {sale.reference}</span>}
                            {sale.ref_code && <span className="text-zinc-600">· {sale.ref_code}</span>}
                          </div>
                          {sale.reject_reason && (
                            <p className="text-red-400/80 text-xs mt-0.5 truncate">{sale.reject_reason}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Events */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-zinc-300 font-medium text-sm">Eventos ({data.events.length})</h3>
                </div>
                {data.events.length === 0 ? (
                  <p className="text-zinc-600 text-sm">Sin eventos registrados</p>
                ) : (
                  <div className="space-y-1">
                    {data.events.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-3 py-2 border-b border-zinc-800/50">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          ev.event_type === "button_click" ? "bg-emerald-500" :
                          ev.event_type === "page_view" ? "bg-blue-500" :
                          "bg-zinc-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <span className="text-zinc-300 text-xs font-medium">
                            {EVENT_LABELS[ev.event_type] || ev.event_type}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-zinc-600 text-xs">
                              {new Date(ev.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })}
                            </span>
                            {ev.fbp && <span className="text-xs text-blue-400/60">fbp ✓</span>}
                            {ev.fbc && <span className="text-xs text-purple-400/60">fbc ✓</span>}
                          </div>
                        </div>
                        {ev.ip && <span className="text-zinc-600 text-xs font-mono">{ev.ip}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-zinc-700 text-xs">
                {(data.contact as any).first_seen_at && `Primer contacto: ${new Date((data.contact as any).first_seen_at).toLocaleDateString("es-AR")}`}
                {data.contact.last_seen_at && ` · Última actividad: ${new Date(data.contact.last_seen_at).toLocaleDateString("es-AR")}`}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
