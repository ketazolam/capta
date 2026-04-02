import { createClient } from "@/lib/supabase/server"
import MetaConnectSection from "@/components/project/meta-connect-section"

export default async function SettingsGeneralPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ meta_connected?: string; meta_error?: string; meta_select?: string; pixels?: string; pixel?: string }>
}) {
  const { projectId } = await params
  const sp = await searchParams
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, org_id, meta_pixel_id, meta_access_token")
    .eq("id", projectId)
    .single()

  const pixels = sp.pixels ? JSON.parse(decodeURIComponent(sp.pixels)) : null

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-8">Configuración</h2>

      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-zinc-800 pb-0">
          {["General", "Miembros", "Notificaciones", "Integraciones"].map((tab, i) => (
            <a
              key={tab}
              href={[
                `/project/${projectId}/settings/general`,
                `/project/${projectId}/settings/members`,
                `/project/${projectId}/settings/notifications`,
                `/project/${projectId}/settings/integrations`,
              ][i]}
              className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                i === 0
                  ? "border-emerald-500 text-white font-medium"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab}
            </a>
          ))}
        </div>

        {/* Nombre */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Nombre del proyecto</h3>
          <input
            type="text"
            defaultValue={project?.name}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Meta Connect */}
        <MetaConnectSection
          projectId={projectId}
          pixelId={project?.meta_pixel_id ?? null}
          hasToken={!!project?.meta_access_token}
          pendingPixels={pixels}
          justConnected={sp.meta_connected === "1"}
          connectedPixelId={sp.pixel ?? null}
          error={sp.meta_error ?? null}
        />

        {/* Atribución */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">
          <div>
            <h3 className="font-semibold text-white">Atribución de campañas</h3>
            <p className="text-zinc-500 text-sm mt-1">Elegí qué eventos se envían a cada plataforma</p>
          </div>

          {["Meta Ads", "TikTok Ads"].map((platform) => (
            <div key={platform}>
              <p className="text-sm font-medium text-zinc-300 mb-3">{platform}</p>
              <div className="space-y-2">
                {[
                  { label: "Vistas de página", desc: "Cuando un visitante visita una página" },
                  { label: "Clicks en botón", desc: "Cuando un visitante hace click en un botón" },
                  { label: "Inicio de conversaciones", desc: "Cuando se inicia una conversación en WhatsApp" },
                  { label: "Ventas", desc: "Cuando ocurre una venta en el chat de WhatsApp" },
                ].map((item) => (
                  <label key={item.label} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      defaultChecked
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

          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg text-sm transition-colors">
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
