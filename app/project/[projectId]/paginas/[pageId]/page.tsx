"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useParams } from "next/navigation"
import { Save, Eye, Globe, Settings, Layout, ExternalLink, Copy, Check } from "lucide-react"
import { toast } from "sonner"
import { getAllTemplates } from "@/lib/templates/registry"
import type { ConfigField } from "@/lib/templates/types"

interface Page {
  id: string
  name: string
  slug: string
  whatsapp_message: string
  auto_redirect: boolean
  template_id: string | null
  template_config: Record<string, unknown> | null
  meta_pixel_id: string | null
  meta_access_token: string | null
  tiktok_pixel_id: string | null
  tiktok_access_token: string | null
  is_published: boolean
  page_type: string | null
  external_url: string | null
  tracking_id: string | null
  custom_domain: string | null
  preferred_line_id: string | null
}

interface Line {
  id: string
  name: string
  phone_number: string | null
  status: string
  is_active: boolean
}

const templates = getAllTemplates()

export default function PageEditorPage() {
  const params = useParams()
  const pageId = params.pageId as string
  const projectId = params.projectId as string

  const [page, setPage] = useState<Page | null>(null)
  const [lines, setLines] = useState<Line[]>([])
  const [tab, setTab] = useState<"settings" | "template">("settings")
  const [saving, setSaving] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta-eight.vercel.app"

  useEffect(() => {
    const supabase = createClient()
    supabase.from("pages").select("*").eq("id", pageId).single()
      .then(({ data }) => { if (data) setPage(data as Page) })
    supabase.from("lines").select("id, name, phone_number, status, is_active")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true })
      .then(({ data }) => { if (data) setLines(data as Line[]) })
  }, [pageId, projectId])

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
        template_id: page.template_id || "whatsapp-redirect",
        template_config: page.template_config,
        meta_pixel_id: page.meta_pixel_id,
        meta_access_token: page.meta_access_token,
        tiktok_pixel_id: page.tiktok_pixel_id,
        tiktok_access_token: page.tiktok_access_token,
        is_published: page.is_published,
        custom_domain: page.custom_domain || null,
        preferred_line_id: page.preferred_line_id || null,
      })
      .eq("id", pageId)
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success("Guardado")
  }

  function setConfigField(key: string, value: unknown) {
    if (!page) return
    setPage({ ...page, template_config: { ...(page.template_config ?? {}), [key]: value } })
  }

  if (!page) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  // External page view
  if (page.page_type === "external") {
    return <ExternalPageView page={page} projectId={projectId} />
  }

  const activeTemplateId = page.template_id || "whatsapp-redirect"
  const activeTemplate = templates.find((t) => t.id === activeTemplateId) ?? templates[0]

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
            onClick={() => setTab("template")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${tab === "template" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            <Layout className="w-3.5 h-3.5" />
            Template
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
            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">General</h4>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Ruta de la página</label>
                <div className="flex items-center gap-1 bg-zinc-800 rounded-lg px-3 py-2">
                  <span className="text-zinc-600 text-sm">/s/</span>
                  <input
                    value={page.slug}
                    onChange={(e) => setPage({ ...page, slug: e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") })}
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

            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Línea WhatsApp</h4>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Línea preferida</label>
                <select
                  value={page.preferred_line_id || ""}
                  onChange={(e) => setPage({ ...page, preferred_line_id: e.target.value || null })}
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
                >
                  <option value="">Automático (round-robin)</option>
                  {lines.map((line) => (
                    <option key={line.id} value={line.id}>
                      {line.status === "connected" && line.is_active ? "🟢" : "🔴"}{" "}
                      {line.name}{line.phone_number ? ` · ${line.phone_number}` : ""}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-zinc-600">
                  Si la línea elegida está desconectada, se usará otra activa automáticamente.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                Dominio Personalizado
              </h4>
              <div className="space-y-1">
                <label className="text-xs text-zinc-500">Dominio (sin https://)</label>
                <input
                  value={page.custom_domain || ""}
                  onChange={(e) => setPage({ ...page, custom_domain: e.target.value.trim().toLowerCase() || null })}
                  placeholder="palace-casino.com.ar"
                  className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
                />
                <p className="text-xs text-zinc-600">DNS: <code className="text-zinc-400">www</code> → CNAME <code className="text-zinc-400">cname.vercel-dns.com</code> · apex → A <code className="text-zinc-400">76.76.21.21</code>. Luego agregar el dominio en Vercel.</p>
              </div>
            </section>

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
              <p className="text-xs text-zinc-600">Dejá vacío para usar la configuración del proyecto.</p>
            </section>

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

        {/* Template tab */}
        {tab === "template" && (
          <div className="w-80 border-r border-zinc-800 overflow-y-auto bg-[#0d0d0d] flex flex-col">
            {/* Template picker */}
            <div className="p-4 border-b border-zinc-800 space-y-3">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Template</h4>
              <div className="grid grid-cols-1 gap-2">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (activeTemplateId === t.id) return
                      if (
                        page.template_config &&
                        Object.keys(page.template_config).length > 0 &&
                        !confirm("¿Cambiar template? Se perderá la configuración actual.")
                      ) return
                      setPage({ ...page, template_id: t.id, template_config: {} })
                    }}
                    className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      activeTemplateId === t.id
                        ? "bg-emerald-500/10 border-emerald-500/40 text-white"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                    }`}
                  >
                    <p className="font-medium">{t.name}</p>
                    <p className="text-xs text-zinc-600 mt-0.5">{t.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Config form — generated from configSchema */}
            {activeTemplate.configSchema.length > 0 && (
              <div className="p-4 space-y-4">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Configuración</h4>
                {activeTemplate.configSchema.map((field: ConfigField) => (
                  <ConfigFieldInput
                    key={field.key}
                    field={field}
                    value={(page.template_config ?? {})[field.key] ?? field.default ?? ""}
                    onChange={(val) => setConfigField(field.key, val)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        <div className="flex-1 bg-zinc-950 flex items-center justify-center p-8">
          <div className="w-80 h-[640px] bg-[#0a0a0a] rounded-[2rem] border-2 border-zinc-700 overflow-hidden shadow-2xl relative">
            <div className="h-full flex flex-col items-center justify-center px-6 text-center space-y-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: (page.template_config?.accentColor as string) || "#22c55e" }}
              >
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-black" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </div>
              <p className="text-white font-semibold text-sm">
                {(page.template_config?.headlineText as string) || (page.auto_redirect ? "Redirigiendo a WhatsApp..." : "Ir a WhatsApp")}
              </p>
              <button
                className="w-full py-3 font-semibold rounded-xl text-sm text-black"
                style={{ background: (page.template_config?.accentColor as string) || "#22c55e" }}
              >
                {(page.template_config?.buttonText as string) || "Ir a WhatsApp ahora"}
              </button>
              {activeTemplateId !== "whatsapp-redirect" && (
                <p className="text-xs text-zinc-500">{activeTemplate.name}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExternalPageView({ page, projectId }: { page: Page; projectId: string }) {
  const [copied, setCopied] = useState(false)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta-eight.vercel.app"
  const scriptSnippet = `<script src="${appUrl}/capta.js" data-tracking-id="${page.tracking_id}" defer></script>`

  function copyScript() {
    navigator.clipboard.writeText(scriptSnippet).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-[#0d0d0d]">
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-violet-400" />
          <span className="text-white font-medium text-sm">{page.name}</span>
          <span className="px-1.5 py-0.5 bg-violet-500/15 text-violet-400 text-xs rounded-full">Externa</span>
        </div>
        <a
          href={`/project/${projectId}/analytics?page_id=${page.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          Ver Analytics
        </a>
      </div>

      <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full space-y-6">
        {/* External URL */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">Página registrada</h3>
          <a
            href={page.external_url ?? ""}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
          >
            <Globe className="w-4 h-4 shrink-0" />
            {page.external_url}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>

        {/* Tracking script */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-300">Script de tracking</h3>
            <button
              onClick={copyScript}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-zinc-500">
            Pegá este script en el <code className="text-zinc-300">&lt;head&gt;</code> o antes del <code className="text-zinc-300">&lt;/body&gt;</code> de tu página:
          </p>
          <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap break-all">
            {scriptSnippet}
          </pre>
          <p className="text-xs text-zinc-600">
            Tracking ID: <code className="text-zinc-400">{page.tracking_id}</code>
          </p>
        </div>

        {/* How it works */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">¿Cómo funciona?</h3>
          <ul className="space-y-2 text-xs text-zinc-500">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 shrink-0">1.</span>
              El script registra automáticamente cada visita como <code className="text-zinc-300">page_view</code>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 shrink-0">2.</span>
              Usá <code className="text-zinc-300">window.capta.trackClick(phone, message)</code> en tus botones de WhatsApp para registrar <code className="text-zinc-300">button_click</code>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 shrink-0">3.</span>
              Los datos aparecen en Analytics de este proyecto, filtrados por esta página
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 shrink-0">4.</span>
              Tu Meta Pixel sigue funcionando de forma independiente — el script de Capta no interfiere
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function ConfigFieldInput({
  field,
  value,
  onChange,
}: {
  field: ConfigField
  value: unknown
  onChange: (val: unknown) => void
}) {
  const strVal = (value as string) ?? ""

  return (
    <div className="space-y-1">
      <label className="text-xs text-zinc-500">{field.label}</label>
      {field.type === "text" && (
        <input
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
        />
      )}
      {field.type === "textarea" && (
        <textarea
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none resize-none border border-zinc-700 focus:border-emerald-500"
        />
      )}
      {field.type === "color" && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={strVal || (field.default as string) || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-9 h-9 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer p-0.5"
          />
          <input
            value={strVal}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || "#000000"}
            className="flex-1 bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
          />
        </div>
      )}
      {field.type === "image-url" && (
        <input
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "https://..."}
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
        />
      )}
      {field.type === "boolean" && (
        <button
          onClick={() => onChange(!value)}
          className={`w-10 h-5.5 rounded-full transition-colors relative ${value ? "bg-emerald-500" : "bg-zinc-700"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${value ? "translate-x-5" : "translate-x-0.5"}`} />
        </button>
      )}
      {field.type === "select" && field.options && (
        <select
          value={strVal}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none border border-zinc-700 focus:border-emerald-500"
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}
