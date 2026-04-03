import SettingsTabs from "@/components/project/settings-tabs"
import { Users } from "lucide-react"

export default async function SettingsMembersPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  return (
    <div className="p-8 max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-8">Configuración</h2>
      <div className="space-y-6">
        <SettingsTabs projectId={projectId} active="members" />
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
          <Users className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-300 font-medium">Gestión de miembros</h3>
          <p className="text-zinc-600 text-sm mt-1">Próximamente podés invitar colaboradores a tu proyecto</p>
        </div>
      </div>
    </div>
  )
}
