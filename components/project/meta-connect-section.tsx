"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, AlertCircle, Loader2, Zap } from "lucide-react"

interface Pixel {
  id: string
  name: string
  accountId: string
  accountName: string
}

interface Props {
  projectId: string
  pixelId: string | null
  hasToken: boolean
  pendingPixels: Pixel[] | null
  justConnected: boolean
  connectedPixelId: string | null
  error: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Cancelaste la conexión con Meta.",
  token_failed: "No se pudo obtener el token de Meta. Intentá de nuevo.",
  no_pixels: "No encontramos pixels en tu cuenta. Verificá que tenés una cuenta publicitaria activa.",
  invalid_state: "Error de estado. Intentá de nuevo.",
  unauthorized: "Tu sesión no coincide con la que inició la conexión. Cerrá sesión y volvé a intentar.",
}

export default function MetaConnectSection({
  projectId,
  pixelId,
  hasToken,
  pendingPixels,
  justConnected,
  connectedPixelId,
  error,
}: Props) {
  const router = useRouter()
  const [selecting, setSelecting] = useState(false)
  const [selectedPixel, setSelectedPixel] = useState<string>("")
  const [saving, setSaving] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualPixelId, setManualPixelId] = useState("")
  const [manualToken, setManualToken] = useState("")
  const [manualSaving, setManualSaving] = useState(false)
  const [manualSaved, setManualSaved] = useState(false)

  const isConnected = !!(pixelId && hasToken)

  async function handleManualSave() {
    if (!manualPixelId.trim() || !manualToken.trim()) return
    setManualSaving(true)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meta_pixel_id: manualPixelId.trim(), meta_access_token: manualToken.trim() }),
      })
      if (res.ok) {
        setManualSaved(true)
        setShowManual(false)
        router.refresh()
      }
    } finally {
      setManualSaving(false)
    }
  }

  async function handleSelectPixel() {
    if (!selectedPixel) return
    setSaving(true)
    try {
      await fetch("/api/auth/meta/select-pixel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, pixelId: selectedPixel }),
      })
      router.push(`/project/${projectId}/settings/general?meta_connected=1&pixel=${selectedPixel}`)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs">f</div>
            Meta Ads
          </h3>
          <p className="text-zinc-500 text-sm mt-0.5">Conectá tu cuenta para enviar eventos vía CAPI</p>
        </div>

        {isConnected ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-full font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            Conectado
          </span>
        ) : (
          <span className="px-2.5 py-1 bg-zinc-800 text-zinc-500 text-xs rounded-full">
            Sin conectar
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-red-400 text-sm">{ERROR_MESSAGES[error] ?? "Error desconocido."}</p>
        </div>
      )}

      {/* Just connected success */}
      {justConnected && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <p className="text-emerald-400 text-sm">
            ¡Conectado! Pixel ID: <span className="font-mono">{connectedPixelId}</span>
          </p>
        </div>
      )}

      {/* Pixel selector when multiple pixels */}
      {pendingPixels && pendingPixels.length > 1 && !isConnected && (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">Encontramos {pendingPixels.length} pixels. ¿Cuál querés usar?</p>
          <div className="space-y-2">
            {pendingPixels.map((p) => (
              <label
                key={p.id}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPixel === p.id
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-700 hover:border-zinc-600"
                }`}
              >
                <input
                  type="radio"
                  name="pixel"
                  value={p.id}
                  checked={selectedPixel === p.id}
                  onChange={(e) => setSelectedPixel(e.target.value)}
                  className="accent-emerald-500"
                />
                <div>
                  <p className="text-white text-sm font-medium">{p.name}</p>
                  <p className="text-zinc-500 text-xs">ID: {p.id} · {p.accountName}</p>
                </div>
              </label>
            ))}
          </div>
          <button
            onClick={handleSelectPixel}
            disabled={!selectedPixel || saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Usar este pixel
          </button>
        </div>
      )}

      {/* Connected info */}
      {isConnected && !justConnected && (
        <div className="p-3 bg-zinc-800 rounded-lg">
          <p className="text-xs text-zinc-400">Pixel ID conectado</p>
          <p className="text-white font-mono text-sm mt-0.5">{pixelId}</p>
        </div>
      )}

      {/* Connect / Reconnect button */}
      {!pendingPixels && (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/api/auth/meta/connect?projectId=${projectId}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            <div className="w-4 h-4 rounded bg-white flex items-center justify-center">
              <span className="text-blue-600 font-bold text-xs">f</span>
            </div>
            {isConnected ? "Reconectar Meta" : "Conectar con Meta"}
          </a>
          <button
            onClick={() => setShowManual(!showManual)}
            className="text-zinc-500 hover:text-zinc-300 text-xs underline transition-colors"
          >
            {showManual ? "Cancelar" : "Configurar manualmente"}
          </button>
        </div>
      )}

      {/* Manual pixel config */}
      {showManual && (
        <div className="space-y-3 p-4 bg-zinc-800 rounded-xl border border-zinc-700">
          <p className="text-xs text-zinc-400 font-medium">Configuración manual — Pixel ID + Access Token</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Pixel ID (ej: 1894140284641996)"
              value={manualPixelId}
              onChange={(e) => setManualPixelId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
            <input
              type="password"
              placeholder="Access Token"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500 font-mono"
            />
          </div>
          <button
            onClick={handleManualSave}
            disabled={!manualPixelId.trim() || !manualToken.trim() || manualSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition-colors"
          >
            {manualSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Guardar
          </button>
          {manualSaved && <p className="text-emerald-400 text-xs">¡Guardado! Refrescá para ver el estado.</p>}
        </div>
      )}
    </div>
  )
}
