import { createClient } from "@/lib/supabase/server"
import { Smartphone } from "lucide-react"
import LineCard from "@/components/project/line-card"
import AddLineDialog from "@/components/project/add-line-dialog"

export default async function LineasPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: lines } = await supabase
    .from("lines")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-white">Líneas WhatsApp</h2>
          <p className="text-zinc-500 text-sm mt-1">Cada línea = 1 número de WhatsApp conectado</p>
        </div>
        <AddLineDialog projectId={projectId} />
      </div>

      {!lines || lines.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-zinc-800 rounded-xl">
          <Smartphone className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-zinc-400 font-medium">No hay líneas configuradas</h3>
          <p className="text-zinc-600 text-sm mt-1">Agregá una línea para empezar a recibir mensajes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lines.map((line) => (
            <LineCard key={line.id} line={line} />
          ))}
        </div>
      )}
    </div>
  )
}
