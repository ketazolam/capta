"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DeletePageButton({
  pageId,
  pageName,
}: {
  pageId: string
  pageName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/pages/${pageId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error al eliminar")
      toast.success("Página eliminada")
      router.refresh()
    } catch {
      toast.error("Error al eliminar la página")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger className="flex-1 text-center py-1.5 bg-zinc-800 hover:bg-red-500/15 hover:text-red-400 text-zinc-400 text-xs rounded-lg transition-colors">
        Eliminar
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">¿Eliminar página?</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Se eliminará <span className="text-white font-medium">{pageName}</span> y todos sus datos. Esta acción no se puede deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-500 text-white"
          >
            {loading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
