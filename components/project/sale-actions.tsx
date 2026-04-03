"use client"

import { useState } from "react"
import { Check, X, Loader2, Image as ImageIcon, Scan } from "lucide-react"
import { useRouter } from "next/navigation"

interface SaleActionsProps {
  saleId: string
  projectId: string
  phone: string | null
  amount: number | null
  imageUrl: string | null
  status: string
}

export default function SaleActions({ saleId, projectId, phone, amount, imageUrl, status }: SaleActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<"confirm" | "reject" | "analyze" | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzed, setAnalyzed] = useState<{
    amount?: number
    reference?: string
    bank?: string
    date?: string
    confidence?: string
  } | null>(null)
  const [editAmount, setEditAmount] = useState(amount?.toString() || "")
  const [editRef, setEditRef] = useState("")
  const [showImageModal, setShowImageModal] = useState(false)
  const [manualImageUrl, setManualImageUrl] = useState(imageUrl || "")
  const [analyzeError, setAnalyzeError] = useState("")

  const handleStatus = async (newStatus: "confirmed" | "rejected") => {
    setLoading(newStatus === "confirmed" ? "confirm" : "reject")
    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          project_id: projectId,
          phone,
          amount: editAmount !== "" && !isNaN(parseFloat(editAmount)) ? parseFloat(editAmount) : amount,
          reference: editRef || undefined,
        }),
      })
      if (!res.ok) throw new Error("Error al actualizar")
      router.refresh()
    } catch {
      alert("Error al actualizar la venta")
    } finally {
      setLoading(null)
    }
  }

  const handleAnalyze = async () => {
    const url = manualImageUrl || imageUrl
    if (!url) return
    setAnalyzing(true)
    setAnalyzeError("")
    try {
      const res = await fetch("/api/sales/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setAnalyzeError(data.error || "Error al analizar")
        return
      }
      setAnalyzed(data)
      if (data.amount) setEditAmount(data.amount.toString())
      if (data.reference) setEditRef(data.reference)
    } catch {
      setAnalyzeError("Error de conexión")
    } finally {
      setAnalyzing(false)
    }
  }

  if (status !== "pending") {
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
        status === "confirmed"
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400"
      }`}>
        {status === "confirmed" ? "Confirmada" : "Rechazada"}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Analyze row */}
      <div className="flex items-center gap-1.5">
        {(imageUrl || manualImageUrl) ? (
          <button
            onClick={() => setShowImageModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
          >
            <ImageIcon className="w-3 h-3" />
            Ver imagen
          </button>
        ) : null}
        <button
          onClick={() => setShowImageModal(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg border border-violet-500/20 transition-colors"
        >
          <Scan className="w-3 h-3" />
          Analizar
        </button>
      </div>

      {/* Editable amount */}
      <div className="flex items-center gap-1.5">
        <span className="text-zinc-500 text-xs">$</span>
        <input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          placeholder="Monto"
          className="w-24 px-2 py-0.5 text-xs bg-zinc-900 border border-zinc-700 rounded text-white focus:outline-none focus:border-zinc-500"
        />
      </div>

      {analyzed && (
        <div className="text-xs text-zinc-400 space-y-0.5">
          {analyzed.bank && <span className="block">🏦 {analyzed.bank}</span>}
          {analyzed.reference && <span className="block">🔑 {editRef || analyzed.reference}</span>}
          {analyzed.date && <span className="block">📅 {analyzed.date}</span>}
          {analyzed.confidence && (
            <span className={`block font-medium ${analyzed.confidence === "high" ? "text-emerald-400" : analyzed.confidence === "medium" ? "text-yellow-400" : "text-red-400"}`}>
              Confianza: {analyzed.confidence === "high" ? "alta" : analyzed.confidence === "medium" ? "media" : "baja"}
            </span>
          )}
        </div>
      )}

      {/* Confirm / Reject */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => handleStatus("confirmed")}
          disabled={!!loading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/20 transition-colors disabled:opacity-50"
        >
          {loading === "confirm" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Confirmar
        </button>
        <button
          onClick={() => handleStatus("rejected")}
          disabled={!!loading}
          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors disabled:opacity-50"
        >
          {loading === "reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Rechazar
        </button>
      </div>

      {/* Image + Analyze modal */}
      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowImageModal(false)}>
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-lg w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Análisis de comprobante</h3>
              <button onClick={() => setShowImageModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image preview */}
            {(imageUrl || manualImageUrl) && (
              <img
                src={manualImageUrl || imageUrl || ""}
                alt="Comprobante"
                className="w-full max-h-64 object-contain rounded-lg border border-zinc-700"
              />
            )}

            {/* URL input */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-500">URL de imagen del comprobante</label>
              <input
                type="text"
                value={manualImageUrl}
                onChange={(e) => setManualImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
              />
            </div>

            {analyzeError && (
              <p className="text-red-400 text-xs">{analyzeError}</p>
            )}

            {analyzed && (
              <div className="bg-zinc-800 rounded-lg p-3 text-sm space-y-1.5">
                <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-2">Datos extraídos</p>
                {analyzed.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Monto</span>
                    <span className="text-emerald-400 font-bold">${analyzed.amount.toLocaleString("es-AR")}</span>
                  </div>
                )}
                {analyzed.reference && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Referencia</span>
                    <span className="text-white">{analyzed.reference}</span>
                  </div>
                )}
                {analyzed.bank && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Banco</span>
                    <span className="text-white">{analyzed.bank}</span>
                  </div>
                )}
                {analyzed.date && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Fecha</span>
                    <span className="text-white">{analyzed.date}</span>
                  </div>
                )}
                {analyzed.confidence && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Confianza</span>
                    <span className={analyzed.confidence === "high" ? "text-emerald-400" : analyzed.confidence === "medium" ? "text-yellow-400" : "text-red-400"}>
                      {analyzed.confidence === "high" ? "Alta ✓" : analyzed.confidence === "medium" ? "Media ~" : "Baja ⚠"}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !manualImageUrl}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 rounded-lg border border-violet-500/20 text-sm font-medium transition-colors disabled:opacity-50"
              >
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                {analyzing ? "Analizando..." : "Analizar"}
              </button>
              <button
                onClick={() => { setShowImageModal(false); handleStatus("confirmed") }}
                disabled={!!loading}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/20 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                Confirmar venta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
