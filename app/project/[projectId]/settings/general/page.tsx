import { createClient } from "@/lib/supabase/server"
import MetaConnectSection from "@/components/project/meta-connect-section"
import SettingsNameForm from "@/components/project/settings-name-form"
import AttributionConfigForm from "@/components/project/attribution-config-form"
import type { AttributionConfig } from "@/components/project/attribution-config-form"
import SettingsTabs from "@/components/project/settings-tabs"

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

  // Try to select all columns — fall back if columns don't exist yet
  let project: { id: string; name: string; org_id: string; meta_pixel_id?: string | null; meta_access_token?: string | null; attribution_config?: AttributionConfig | null } | null = null
  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select("id, name, org_id, meta_pixel_id, meta_access_token, attribution_config")
    .eq("id", projectId)
    .single()

  if (projectError && projectError.code === "42703") {
    const { data: fallback } = await supabase
      .from("projects")
      .select("id, name, org_id")
      .eq("id", projectId)
      .single()
    project = fallback ? { ...fallback, meta_pixel_id: null, meta_access_token: null, attribution_config: null } : null
  } else {
    project = projectData
  }

  let pixels = null
  try {
    pixels = sp.pixels ? JSON.parse(decodeURIComponent(sp.pixels)) : null
  } catch {
    // malformed pixels param — ignore
  }

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-8">Configuración</h2>

      <div className="space-y-6">
        {/* Tabs */}
        <SettingsTabs projectId={projectId} active="general" />

        {/* Nombre */}
        <SettingsNameForm projectId={projectId} initialName={project?.name ?? ""} />

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
        <AttributionConfigForm
          projectId={projectId}
          initialConfig={project?.attribution_config ?? null}
        />
      </div>
    </div>
  )
}
