"use client"

import { useState } from "react"
import { Plus, X, Loader2, Scan } from "lucide-react"
import { useRouter } from "next/navigation"

export default function NuevaVentaButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [form, setForm] = useState({ phone: "", amount: "", reference: "", imageUrl: "" })
  const [analyzed, setAnalyzed] = useState<{ bank?: string; confidence?: string } | null>(null)

  const handleAnalyze = async () => {
    if (!form.imageUrl) return
    setAnalyzing(true)
    try {
      const res = await fetch("/api/sales/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: form.imageUrl }),
      })
      const data = await res.json()
      if (res.ok && !data.error) {
        setAnalyzed(data)
        setForm((f) => ({
          ...f,
          amount: data.amount?.toString() || f.amount,
          reference: data.reference || f.reference,
        }))
      }
    } catch { /* silent */ }
    finally { setAnalyzing(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          phone: form.phone || null,
          amount: form.amount ? parseFloat(form.amount) : null,
          reference: form.reference || null,
          image_url: form.imageUrl || null,
        }),
      })
      if (!res.ok) throw new Error("Error")
      setOpen(false)
      setForm({ phone: "", amount: "", reference: "", imageUrl: "" })
      setAnalyzed(null)
      router.refresh()
    } catch { alert("Error al crear la venta") }
    finally { setLoading(false) }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 text-sm font-medium transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nueva venta
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-semibold">Nueva venta</h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Teléfono del cliente</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="5491130395470"
                  className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              {/* Image URL + Analyze */}
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">URL del comprobante (opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.imageUrl}
                    onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing || !form.imageUrl}
                    className="px-3 py-2 bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 rounded-lg border border-violet-500/20 text-sm transition-colors disabled:opacity-50"
                  >
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                  </button>
                </div>
                {analyzed?.bank && (
                  <p className="text-xs text-zinc-500 mt-1">
                    🏦 {analyzed.bank} — confianza {analyzed.confidence === "high" ? "alta ✓" : analyzed.confidence === "medium" ? "media ~" : "baja ⚠"}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Monto (ARS)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="15000"
                  className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Referencia / Nro. transacción</label>
                <input
                  type="text"
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="REF-123456"
                  className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-zinc-500"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 rounded-lg border border-emerald-500/20 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Crear pendiente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
