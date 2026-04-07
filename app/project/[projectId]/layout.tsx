import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProjectSidebar from "@/components/layout/project-sidebar"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, org_id")
    .eq("id", projectId)
    .maybeSingle()

  if (!project) redirect("/dashboard")

  const [{ data: creditsRow }, { data: allProjects }] = await Promise.all([
    supabase.from("credits").select("balance").eq("org_id", project.org_id).maybeSingle(),
    supabase.from("projects").select("id, name").eq("org_id", project.org_id).order("created_at", { ascending: false }),
  ])

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      <ProjectSidebar
        projectId={projectId}
        projectName={project.name}
        credits={creditsRow?.balance ?? 0}
        allProjects={allProjects ?? []}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
