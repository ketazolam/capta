"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export interface AttributionConfig {
  meta: Record<string, boolean>
  tiktok: Record<string, boolean>
}

const DEFAULT_CONFIG: AttributionConfig = {
  meta: { page_view: true, button_click: true, purchase: true },
  tiktok: { page_view: true, button_click: true, purchase: true },
}

const EVENT_LABELS: { key: string; label: string; desc: string }[] = [
  { key: "page_view", label: "Vistas de página", desc: "Cuando un visitante visita una página" },
  { key: "button_click", label: "Clicks en botón", desc: "Cuando un visitante hace click en un botón" },
  { key: "purchase", label: "Ventas", desc: "Cuando ocurre una venta en el chat de WhatsApp" },
]

export default function AttributionConfigForm({
  projectId,
  initialConfig,
}: {
  projectId: string
  initialConfig: AttributionConfig | null
}) {
  const [config, setConfig] = useState<AttributionConfig>(initialConfig ?? DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)

  function toggle(platform: "meta" | "tiktok", key: string) {
    setConfig((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], [key]: !prev[platform][key] },
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("projects")
        .update({ attribution_config: config })
        .eq("id", projectId)
      if (error) throw error
      toast.success("Configuración guardada")
    } catch {
      toast.error("Error al guardar")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
      <div>
        <h3 className="font-semibold text-white">Atribución de campañas</h3>
        <p className="text-zinc-500 text-sm mt-1">Elegí qué eventos se envían a cada plataforma</p>
      </div>

      {(["meta", "tiktok"] as const).map((platform) => (
        <div key={platform}>
          <p className="text-sm font-medium text-zinc-300 mb-3">
            {platform === "meta" ? "Meta Ads" : "TikTok Ads"}
          </p>
          <div className="space-y-2">
            {EVENT_LABELS.map((item) => (
              <label key={item.key} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={config[platform][item.key] ?? true}
                  onChange={() => toggle(platform, item.key)}
                  className="mt-0.5 rounded border-zinc-700 bg-zinc-800 accent-emerald-500"
                />
                <div>
                  <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{item.label}</p>
                  <p className="text-xs text-zinc-600">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition-colors"
      >
        {saving ? "Guardando..." : "Guardar"}
      </button>
    </div>
  )
}
