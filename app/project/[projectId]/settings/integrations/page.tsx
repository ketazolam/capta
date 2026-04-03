import { createClient } from "@/lib/supabase/server"
import SettingsTabs from "@/components/project/settings-tabs"
import Link from "next/link"

export default async function SettingsIntegrationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("meta_pixel_id, meta_access_token")
    .eq("id", projectId)
    .single()

  const { data: lines } = await supabase
    .from("lines")
    .select("id, name, status, is_active")
    .eq("project_id", projectId)

  const connectedLines = lines?.filter((l) => l.status === "connected") ?? []

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-8">Configuración</h2>
      <div className="space-y-6">
        <SettingsTabs projectId={projectId} active="integrations" />

        {/* Meta Ads */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-bold text-sm">f</span>
              </div>
              <div>
                <p className="text-white font-medium text-sm">Meta Ads</p>
                <p className="text-zinc-500 text-xs">
                  {project?.meta_pixel_id
                    ? `Pixel conectado: ${project.meta_pixel_id}`
                    : "Sin conectar"}
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              project?.meta_pixel_id
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-zinc-800 text-zinc-500"
            }`}>
              {project?.meta_pixel_id ? "Conectado" : "Sin conectar"}
            </span>
          </div>
          {!project?.meta_pixel_id && (
            <div className="mt-3">
              <Link
                href={`/project/${projectId}/settings/general`}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                Conectar Meta Ads →
              </Link>
            </div>
          )}
        </div>

        {/* WhatsApp Lines */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-emerald-400" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-medium text-sm">WhatsApp</p>
                <p className="text-zinc-500 text-xs">
                  {connectedLines.length} de {lines?.length ?? 0} líneas conectadas
                </p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              connectedLines.length > 0
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-zinc-800 text-zinc-500"
            }`}>
              {connectedLines.length > 0 ? "Activo" : "Sin líneas"}
            </span>
          </div>
          <Link
            href={`/project/${projectId}/lineas`}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Gestionar líneas →
          </Link>
        </div>
      </div>
    </div>
  )
}
