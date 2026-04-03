"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { getAllTemplates } from "@/lib/templates/registry"

const templates = getAllTemplates()

export default function NewPageDialog({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "whatsapp-redirect")
  const [loading, setLoading] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    setSlug(val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""))
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from("pages")
      .insert({ project_id: projectId, name, slug, template_id: templateId })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success("Página creada")
    setOpen(false)
    router.push(`/project/${projectId}/paginas/${data.id}`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-sm transition-colors"
      >
        <Plus className="w-4 h-4" />
        Nueva página
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>Nueva página</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-zinc-300">Nombre</Label>
            <Input
              placeholder="ej: Casino Palace"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Slug (URL)</Label>
            <div className="flex items-center gap-1">
              <span className="text-zinc-600 text-sm">/s/</span>
              <Input
                placeholder="casino-palace"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-zinc-300">Template</Label>
            <div className="grid grid-cols-1 gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplateId(t.id)}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                    templateId === t.id
                      ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
              {loading ? "Creando..." : "Crear página"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
