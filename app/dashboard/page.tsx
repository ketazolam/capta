import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Layers, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import NewProjectDialog from "@/components/project/new-project-dialog"
import DeleteProjectButton from "@/components/project/delete-project-button"
import { signOut } from "@/lib/supabase/actions"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  // Get orgs for this user
  const { data: orgs } = await supabase
    .from("org_members")
    .select("org_id, role, organizations(id, name, slug)")
    .eq("user_id", user.id)

  const orgRaw = orgs?.[0]?.organizations
  const orgId = (orgRaw as unknown as { id: string } | null)?.id

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })

  const { data: creditsRow } = await supabase
    .from("credits")
    .select("balance")
    .eq("org_id", orgId)
    .single()

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Top bar */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
            <span className="text-black font-bold text-xs">C</span>
          </div>
          <span className="font-semibold text-white">Capta</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-emerald-400 font-medium">{creditsRow?.balance ?? 0}</span>
            <span className="text-zinc-500">créditos</span>
          </div>
          <form action={signOut}>
            <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Proyectos</h1>
            <p className="text-zinc-500 text-sm mt-1">Cada proyecto es un negocio o cliente</p>
          </div>
          <NewProjectDialog orgId={orgId!} />
        </div>

        {(!projects || projects.length === 0) ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-xl">
            <Layers className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No tenés proyectos todavía</p>
            <p className="text-zinc-600 text-xs mt-1">Creá uno para empezar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="relative group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all">
                <Link href={`/project/${project.id}/analytics`} className="block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <span className="text-emerald-400 font-bold text-sm">
                        {project.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-zinc-600 text-xs mt-1">
                    {new Date(project.created_at).toLocaleDateString("es-AR")}
                  </p>
                </Link>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DeleteProjectButton projectId={project.id} projectName={project.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
