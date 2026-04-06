import { createClient } from "@/lib/supabase/server"
import { FileText, Globe, ExternalLink } from "lucide-react"
import Link from "next/link"
import NewPageDialog from "@/components/project/new-page-dialog"
import DeletePageButton from "@/components/project/delete-page-button"

export default async function PaginasPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: pages } = await supabase
    .from("pages")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://capta-eight.vercel.app"

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">Páginas</h2>
          <p className="text-zinc-500 text-sm mt-1">Páginas Capta (smart links) y páginas externas con tracking</p>
        </div>
        <NewPageDialog projectId={projectId} />
      </div>

      {!pages || pages.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
          <FileText className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">No hay páginas</h3>
          <p className="text-zinc-600 text-sm mt-1">Creá una página Capta o registrá una página externa</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => {
            const isExternal = page.page_type === "external"
            const displayUrl = isExternal
              ? page.external_url
              : page.custom_domain
                ? `https://${page.custom_domain}`
                : `${appUrl}/s/${page.slug}`

            return (
              <div key={page.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden group hover:border-zinc-700 transition-colors">
                {/* Preview thumbnail */}
                <div className="h-32 bg-zinc-800 flex items-center justify-center relative">
                  <div className="text-center px-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${isExternal ? "bg-violet-500/15" : "bg-emerald-500/15"}`}>
                      {isExternal
                        ? <ExternalLink className="w-4 h-4 text-violet-400" />
                        : <Globe className="w-4 h-4 text-emerald-400" />
                      }
                    </div>
                    <p className="text-xs text-zinc-400 truncate max-w-[200px]">
                      {displayUrl}
                    </p>
                  </div>

                  {/* Badge */}
                  {isExternal ? (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-violet-500/15 text-violet-400 text-xs rounded-full">Externa</span>
                  ) : page.is_published ? (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 text-xs rounded-full">Publicada</span>
                  ) : (
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs rounded-full">Borrador</span>
                  )}
                </div>

                <div className="p-4">
                  <p className="font-medium text-white">{page.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {isExternal ? page.external_url : `/${page.slug}`}
                  </p>

                  <div className="flex gap-2 mt-3">
                    {isExternal ? (
                      <>
                        <Link
                          href={`/project/${projectId}/paginas/${page.id}`}
                          className="flex-1 text-center py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                        >
                          Ver script
                        </Link>
                        <a
                          href={page.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                        >
                          Abrir
                        </a>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/project/${projectId}/paginas/${page.id}`}
                          className="flex-1 text-center py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                        >
                          Editar
                        </Link>
                        <a
                          href={`${appUrl}/s/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-center py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition-colors"
                        >
                          Ver
                        </a>
                      </>
                    )}
                    <DeletePageButton pageId={page.id} pageName={page.name} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
