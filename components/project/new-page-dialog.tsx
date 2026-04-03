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

function toSlug(val: string) {
  return val.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export default function NewPageDialog({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pageType, setPageType] = useState<"internal" | "external">("internal")
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [externalUrl, setExternalUrl] = useState("")
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "whatsapp-redirect")
  const [loading, setLoading] = useState(false)

  function handleNameChange(val: string) {
    setName(val)
    setSlug(toSlug(val))
  }

  function handleReset() {
    setPageType("internal")
    setName("")
    setSlug("")
    setExternalUrl("")
    setTemplateId(templates[0]?.id ?? "whatsapp-redirect")
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    if (pageType === "external") {
      const trackingId = crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      const extSlug = `ext-${toSlug(name)}-${trackingId.slice(0, 6)}`
      const { data, error } = await supabase
        .from("pages")
        .insert({
          project_id: projectId,
          name,
          slug: extSlug,
          page_type: "external",
          external_url: externalUrl,
          tracking_id: trackingId,
          is_published: false,
          template_id: "whatsapp-redirect",
        })
        .select()
        .single()

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Página externa registrada")
      setOpen(false)
      handleReset()
      router.push(`/project/${projectId}/paginas/${data.id}`)
      router.refresh()
      return
    }

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
    handleReset()
    router.push(`/project/${projectId}/paginas/${data.id}`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) handleReset() }}>
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
          {/* Page type toggle */}
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
            <button
              type="button"
              onClick={() => setPageType("internal")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                pageType === "internal"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Página Capta
            </button>
            <button
              type="button"
              onClick={() => setPageType("external")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                pageType === "external"
                  ? "bg-zinc-700 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Página Externa
            </button>
          </div>

          {pageType === "external" && (
            <p className="text-xs text-zinc-500 -mt-1">
              Registrá una página que ya existe en otro dominio. Capta te dará un script de tracking para incluir.
            </p>
          )}

          <div className="space-y-2">
            <Label className="text-zinc-300">Nombre</Label>
            <Input
              placeholder={pageType === "external" ? "ej: Landing Palace Vercel" : "ej: Casino Palace"}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          {pageType === "internal" && (
            <>
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
            </>
          )}

          {pageType === "external" && (
            <div className="space-y-2">
              <Label className="text-zinc-300">URL de la página</Label>
              <Input
                placeholder="https://mi-landing.vercel.app"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                required
                type="url"
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
              {loading ? "Creando..." : pageType === "external" ? "Registrar página" : "Crear página"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
