"use client"

import { useEffect, useState } from "react"
import { X, ExternalLink, Shield, Maximize2, Check, Loader2, Scan } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface SaleDetail {
  sale: {
    id: string
    amount: number | null
    status: string
    image_url: string | null
    reference: string | null
    created_at: string
    reject_reason: string | null
    ref_code: string | null
    meta_event_sent: boolean | null
    visitor_fbp: string | null
    visitor_fbc: string | null
    visitor_ip: string | null
    visitor_session_id: string | null
    page_id: string | null
    phone: string | null
    raw_text: string | null
    contacts: { id: string; name: string | null; phone: string; total_purchases: number; purchase_count: number } | null
  }
  events: Array<{
    id: string
    event_type: string
    created_at: string
    session_id: string | null
    fbp: string | null
    ip: string | null
    page_id: string | null
  }>
}

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  rejected: "bg-red-500/15 text-red-400 border-red-500/20",
}
const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmada",
  pending: "Pendiente",
  rejected: "Rechazada",
}

interface Props {
  saleId: string | null
  projectId: string
  onClose: () => void
}

export default function SaleDetailDrawer({ saleId, projectId, onClose }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SaleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState<{ amount?: number; reference?: string; bank?: string; date?: string; confidence?: string } | null>(null)
  const [actionLoading, setActionLoading] = useState<"confirm" | "reject" | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showReject, setShowReject] = useState(false)

  useEffect(() => {
    if (!saleId) { setData(null); setAnalyzed(null); setShowReject(false); setFetchError(false); return }
    setLoading(true)
    setFetchError(false)
    fetch(`/api/sales/${saleId}/detail`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setData)
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [saleId])

  const handleStatus = async (status: "confirmed" | "rejected") => {
    if (!data) return
    setActionLoading(status === "confirmed" ? "confirm" : "reject")
    try {
      // If IA analyzed a different amount, use that as the authoritative value
      const effectiveAmount = status === "confirmed" && analyzed?.amount
        ? analyzed.amount
        : data.sale.amount
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          project_id: projectId,
          phone: data.sale.phone,
          amount: effectiveAmount,
          ...(status === "confirmed" && analyzed?.reference ? { reference: analyzed.reference } : {}),
          ...(status === "rejected" && rejectReason ? { reject_reason: rejectReason } : {}),
        }),
      })
      if (!res.ok) throw new Error()
      router.refresh()
      onClose()
    } catch {
      toast.error("Error al actualizar la venta")
    } finally {
      setActionLoading(null)
    }
  }

  const handleAnalyze = async () => {
    const url = data?.sale.image_url
    if (!url) return
    setAnalyzing(true)
    try {
      const res = await fetch("/api/sales/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      })
      const result = await res.json()
      if (result.error) { toast.error(result.error); return }
      setAnalyzed(result)
    } catch {
      toast.error("Error al analizar")
    } finally {
      setAnalyzing(false)
    }
  }

  if (!saleId) return null

  const sale = data?.sale

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-zinc-950 border-l border-zinc-800 flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-800">
          {loading || !sale ? (
            <div className="space-y-2">
              <div className="h-7 w-32 bg-zinc-800 rounded animate-pulse" />
              <div className="h-5 w-24 bg-zinc-800 rounded animate-pulse" />
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-2xl">
                  {sale.amount ? `$${Number(sale.amount).toLocaleString("es-AR")}` : "Sin monto"}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[sale.status] || ""}`}>
                  {STATUS_LABELS[sale.status] || sale.status}
                </span>
              </div>
              <p className="text-zinc-500 text-sm mt-1">
                {new Date(sale.created_at).toLocaleString("es-AR", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            </div>
          )}
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors ml-4 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
            </div>
          )}

          {fetchError && (
            <div className="flex items-center justify-center h-40">
              <p className="text-zinc-500 text-sm">No se pudo cargar la venta</p>
            </div>
          )}

          {sale && (
            <div className="p-6 space-y-6">
              {/* Comprobante image */}
              {sale.image_url && (
                <div>
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-2">Comprobante</p>
                  <div className="relative group">
                    <img
                      src={sale.image_url}
                      alt="Comprobante"
                      className="w-full max-h-72 object-contain rounded-xl border border-zinc-800 bg-zinc-900 cursor-zoom-in"
                      onClick={() => setLightbox(true)}
                    />
                    <button
                      onClick={() => setLightbox(true)}
                      className="absolute top-2 right-2 p-1.5 bg-zinc-900/80 rounded-lg text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Analyze button */}
                  {sale.status === "pending" && (
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg border border-violet-500/20 text-sm transition-colors disabled:opacity-50"
                    >
                      {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                      {analyzing ? "Analizando..." : "Analizar con IA"}
                    </button>
                  )}
                </div>
              )}

              {/* Analysis results */}
              {analyzed && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-3">Datos extraídos</p>
                  <div className="space-y-2">
                    {analyzed.amount && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Monto</span>
                        <span className="text-emerald-400 font-bold">${Number(analyzed.amount).toLocaleString("es-AR")}</span>
                      </div>
                    )}
                    {analyzed.bank && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Banco</span>
                        <span className="text-white">{analyzed.bank}</span>
                      </div>
                    )}
                    {analyzed.reference && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Referencia</span>
                        <span className="text-white font-mono text-xs">{analyzed.reference}</span>
                      </div>
                    )}
                    {analyzed.date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Fecha</span>
                        <span className="text-white">{analyzed.date}</span>
                      </div>
                    )}
                    {analyzed.confidence && (
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Confianza</span>
                        <span className={analyzed.confidence === "high" ? "text-emerald-400" : analyzed.confidence === "medium" ? "text-yellow-400" : "text-red-400"}>
                          {analyzed.confidence === "high" ? "Alta ✓" : analyzed.confidence === "medium" ? "Media ~" : "Baja ⚠"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Contact info */}
              {sale.contacts && (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-3">Cliente</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{sale.contacts.name || "Sin nombre"}</p>
                      <p className="text-zinc-400 text-sm">{sale.contacts.phone}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-emerald-400 font-medium text-sm">
                          {sale.contacts.total_purchases > 0
                            ? `$${Number(sale.contacts.total_purchases).toLocaleString("es-AR")}`
                            : "—"}
                        </p>
                        <p className="text-zinc-600 text-xs">{sale.contacts.purchase_count} compras</p>
                      </div>
                      <a
                        href={`https://wa.me/${sale.contacts.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Sale details */}
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-2">
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider mb-3">Detalles</p>
                {sale.reference && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Referencia</span>
                    <span className="text-white font-mono text-xs">{sale.reference}</span>
                  </div>
                )}
                {sale.ref_code && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Campaña</span>
                    <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded text-xs">{sale.ref_code}</span>
                  </div>
                )}
                {sale.reject_reason && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Motivo rechazo</span>
                    <span className="text-red-400 text-xs">{sale.reject_reason}</span>
                  </div>
                )}
                {sale.raw_text && (
                  <details className="mt-1">
                    <summary className="text-zinc-500 text-xs cursor-pointer hover:text-zinc-300">Ver texto extraído por IA</summary>
                    <p className="text-zinc-500 text-xs font-mono mt-1 whitespace-pre-wrap break-all bg-zinc-800 rounded p-2">{sale.raw_text}</p>
                  </details>
                )}
              </div>

              {/* CAPI / tracking info */}
              <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 space-y-2">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-3.5 h-3.5 text-zinc-500" />
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">Tracking Meta</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">CAPI enviado</span>
                  <span className={sale.meta_event_sent ? "text-emerald-400" : "text-zinc-600"}>
                    {sale.meta_event_sent ? "Sí ✓" : "No"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">fbp</span>
                  <span className={sale.visitor_fbp ? "text-blue-400 text-xs font-mono truncate max-w-[180px]" : "text-zinc-600"}>
                    {sale.visitor_fbp ? sale.visitor_fbp.slice(0, 30) + "…" : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">IP visitante</span>
                  <span className="text-zinc-400 text-xs font-mono">{sale.visitor_ip || "—"}</span>
                </div>
                {data?.events && data.events.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-zinc-800">
                    <p className="text-zinc-500 text-xs mb-1">Eventos de sesión</p>
                    {data.events.map((ev) => (
                      <div key={ev.id} className="flex items-center gap-2 text-xs text-zinc-500 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                        <span>{ev.event_type}</span>
                        <span className="text-zinc-700">{new Date(ev.created_at).toLocaleTimeString("es-AR")}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions for pending */}
              {sale.status === "pending" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatus("confirmed")}
                      disabled={!!actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-xl border border-emerald-500/20 font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading === "confirm" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Confirmar venta
                    </button>
                    <button
                      onClick={() => setShowReject(!showReject)}
                      disabled={!!actionLoading}
                      className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 font-medium transition-colors disabled:opacity-50 text-sm"
                    >
                      Rechazar
                    </button>
                  </div>
                  {showReject && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Motivo de rechazo..."
                        className="flex-1 px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-red-500"
                      />
                      <button
                        onClick={() => handleStatus("rejected")}
                        disabled={!!actionLoading || !rejectReason.trim()}
                        className="px-3 py-2 bg-red-500/15 text-red-400 rounded-lg border border-red-500/20 text-sm font-medium disabled:opacity-50"
                      >
                        {actionLoading === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : "OK"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && sale?.image_url && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <img
            src={sale.image_url}
            alt="Comprobante"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 p-2 bg-zinc-900/80 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}
    </>
  )
}
