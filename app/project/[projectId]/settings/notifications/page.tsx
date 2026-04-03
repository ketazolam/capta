import SettingsTabs from "@/components/project/settings-tabs"
import NotificationSettingsForm from "@/components/project/notification-settings-form"
import { createClient } from "@/lib/supabase/server"

export default async function SettingsNotificationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: project } = await supabase
    .from("projects")
    .select("notification_phone")
    .eq("id", projectId)
    .single()

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-8">Configuración</h2>
      <div className="space-y-6">
        <SettingsTabs projectId={projectId} active="notifications" />
        <NotificationSettingsForm
          projectId={projectId}
          initialPhone={project?.notification_phone || ""}
        />
      </div>
    </div>
  )
}
