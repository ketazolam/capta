"use client"

import { useState } from "react"

export default function NotificationSettingsForm({
  projectId,
  initialPhone,
}: {
  projectId: string
  initialPhone: string
}) {
  const [phone, setPhone] = useState(initialPhone)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function handleSave() {
    setSaving(true)
    setError("")
    setSaved(false)
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_phone: phone.trim() || null }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Error al guardar")
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-white font-medium mb-1">Notificación de comprobantes</h3>
        <p className="text-zinc-500 text-sm">
          Cuando llegue un comprobante, se enviará un mensaje de WhatsApp a este número.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="notification_phone" className="text-sm text-zinc-400">
          Teléfono de notificación
        </label>
        <input
          id="notification_phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+5491112345678"
          className="w-full px-3 py-2 text-sm bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50"
        />
        <p className="text-zinc-600 text-xs">
          Formato: código de país + número sin espacios ni guiones (ej: +5491112345678)
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar"}
        </button>
        {saved && <span className="text-emerald-400 text-sm">Guardado</span>}
        {error && <span className="text-red-400 text-sm">{error}</span>}
      </div>
    </div>
  )
}
