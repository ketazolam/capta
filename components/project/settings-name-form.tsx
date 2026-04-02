"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function SettingsNameForm({ projectId, initialName }: { projectId: string; initialName: string }) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("projects")
      .update({ name: name.trim() })
      .eq("id", projectId)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Nombre actualizado")
    router.refresh()
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <h3 className="font-semibold text-white">Nombre del proyecto</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
      />
      <button
        onClick={handleSave}
        disabled={saving || name === initialName}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm transition-colors"
      >
        {saving ? "Guardando..." : "Guardar nombre"}
      </button>
    </div>
  )
}
