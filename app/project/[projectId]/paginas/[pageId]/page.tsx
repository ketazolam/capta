"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams, useRouter } from "next/navigation"
import { Save, Eye, Globe, Settings, Code } from "lucide-react"
import { toast } from "sonner"

interface Page {
  id: string
  name: string
  slug: string
  whatsapp_message: string
  auto_redirect: boolean
  html_content: string | null
  meta_pixel_id: string | null
  meta_access_token: string | null
  tiktok_pixel_id: string | null
  tiktok_access_token: string | null
  is_published: boolean
}

export default function PageEditorPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.pageId as string
  const projectId = params.projectId as string

  const [page, setPage] = useState<Page | null>(null)
  const [tab, setTab] = useState<"settings" | "html">("settings")
  const [saving, setSaving] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta.vercel.app"

  useEffect(() => {
    const supabase = createClient()
    supabase.from("pages").select("*").eq("id", pageId).single()
      .then(({ data }) => { if (data) setPage(data) })
  }, [pageId])

  async function handleSave() {
    if (!page) return
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("pages")
      .update({
        name: page.name,
        slug: page.slug,
        whatsapp_message: page.whatsapp_message,
        auto_redirect: page.auto_redirect,
        html_content: page.html_content,
        meta_pixel_id: page.meta_pixel_id,
        meta_access_token: page.meta_access_token,
        tiktok_pixel_id: page.tiktok_pixel_id,
        tiktok_access_token: page.tiktok_access_token,
        is_published: page.is_published,
      })
      .eq("id", pageId)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success("Guardado")
  }

  if (!page) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#0d0d0d]">
        <input
          value={page.name}
          onChange={(e) => setPage({ ...page, name: e.target.value })}
          className="bg-transparent text-white font-medium text-sm border-none outline-none w-48"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("settings")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${tab === "settings" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Settings className="w-3.5 h-3.5" />
            Configuración
          </button>
          <button
            onClick={() => setTab("html")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${tab === "html" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Code className="w-3.5 h-3.5" />
            HTML
          </button>
          <a
            href={`${appUrl}/s/${page.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-xs transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Settings panel */}
        {tab === "settings" && (
          <div className="w-80 border-r border-zinc-800 overflow-y-auto p-5 space-y-6 bg-[#0d0d0d]">
            {/* General */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">General</h4>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Ruta de la página</label>
                <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-3 py-2">
                  <span className="text-zinc-600 text-sm">/s/</span>
                  <input
                    value={page.slug}
                    onChange={(e) => setPage({ ...page, slug: e.target.value })}
                    className="bg-transparent text-white text-sm flex-1 outline-none"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Mensaje de WhatsApp</label>
                <textarea
                  value={page.whatsapp_message}
                  onChange={(e) => setPage({ ...page, whatsapp_message: e.target.value })}
                  rows={3}
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none border border-zinc-700 focus:border-emerald-500"
                />
                <p className="text-xs text-zinc-600">Usá {"{{ref}}"} para incluir el código de referencia</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Redirección automática</p>
                  <p className="text-xs text-zinc-600">Redirige al usuario automáticamente</p>
                </div>
                <button
                  onClick={() => setPage({ ...page, auto_redirect: !page.auto_redirect })}
                  className={`w-10 h-5.5 rounded-full transition-colors relative ${page.auto_redirect ? "bg-emerald-500" : "bg-zinc-700"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${page.auto_redirect ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Publicada</p>
                  <p className="text-xs text-zinc-600">Visible al público</p>
                </div>
                <button
                  onClick={() => setPage({ ...page, is_published: !page.is_published })}
                  className={`w-10 h-5.5 rounded-full transition-colors relative ${page.is_published ? "bg-emerald-500" : "bg-zinc-700"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${page.is_published ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </section>

            {/* Meta Pixel */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                Meta Pixel
              </h4>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">ID de Pixel</label>
                <input
                  value={page.meta_pixel_id || ""}
                  onChange={(e) => setPage({ ...page, meta_pixel_id: e.target.value })}
                  placeholder="123456789012345"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Token de Acceso (CAPI)</label>
                <input
                  type="password"
                  value={page.meta_access_token || ""}
                  onChange={(e) => setPage({ ...page, meta_access_token: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
                />
              </div>
            </section>

            {/* TikTok Pixel */}
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">TikTok Pixel</h4>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Pixel Code</label>
                <input
                  value={page.tiktok_pixel_id || ""}
                  onChange={(e) => setPage({ ...page, tiktok_pixel_id: e.target.value })}
                  placeholder="ABCDEFGHIJ"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Access Token</label>
                <input
                  type="password"
                  value={page.tiktok_access_token || ""}
                  onChange={(e) => setPage({ ...page, tiktok_access_token: e.target.value })}
                  placeholder="••••••••••••••••"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
                />
              </div>
            </section>
          </div>
        )}

        {/* HTML Editor */}
        {tab === "html" && (
          <div className="w-80 border-r border-zinc-800 bg-[#0d0d0d] flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-800">
              <p className="text-xs text-zinc-500">Editor HTML personalizado</p>
              <p className="text-xs text-zinc-600 mt-0.5">Reemplaza el contenido por defecto de la página</p>
            </div>
            <textarea
              value={page.html_content || ""}
              onChange={(e) => setPage({ ...page, html_content: e.target.value })}
              placeholder="<div>Tu HTML aquí...</div>"
              className="flex-1 bg-[#0d0d0d] text-green-400 text-xs font-mono p-4 resize-none outline-none"
            />
          </div>
        )}

        {/* Preview */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center p-8">
          <div className="w-80 h-[640px] bg-[#0a0a0a] rounded-[2rem] border-2 border-zinc-700 overflow-hidden shadow-2xl relative">
            <div className="h-full flex flex-col items-center justify-center px-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-xl bg-emerald-500 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-black" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </div>
              <p className="text-white font-semibold">Redirigiendo a WhatsApp...</p>
              <p className="text-zinc-500 text-xs">En unos segundos se abrirá el chat</p>
              <button className="w-full py-3 bg-emerald-500 text-black font-semibold rounded-xl text-sm">
                Ir a WhatsApp ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
