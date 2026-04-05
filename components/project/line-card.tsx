"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { MoreHorizontal, Zap, QrCode, RefreshCw, Loader2, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Line {
  id: string
  name: string
  phone_number: string | null
  status: string
  is_active: boolean
  is_incognito: boolean
  days_remaining: number
}

export default function LineCard({ line: initialLine }: { line: Line }) {
  const [line, setLine] = useState(initialLine)
  const [showQR, setShowQR] = useState(false)
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(line.name)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleted, setDeleted] = useState(false)

  async function handleRename() {
    if (!newName.trim() || newName === line.name) {
      setRenaming(false)
      return
    }
    try {
      const res = await fetch(`/api/lines/${line.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (!res.ok) throw new Error()
      setLine((l) => ({ ...l, name: newName.trim() }))
      toast.success("Línea renombrada")
    } catch {
      toast.error("Error al renombrar")
      setNewName(line.name)
    }
    setRenaming(false)
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/lines/${line.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Línea eliminada")
      setDeleted(true)
    } catch {
      toast.error("Error al eliminar la línea")
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const [qrError, setQrError] = useState<string | null>(null)

  const qrPollCount = useRef(0)

  const fetchQR = useCallback(async () => {
    setQrLoading(true)
    try {
      const res = await fetch(`/api/lines/${line.id}/qr`)
      if (res.status === 404) {
        setQrError("Sesión no encontrada. Cerrá el panel y volvé a hacer clic en Escanear QR.")
        return
      }
      if (res.status === 502 || res.status === 503) {
        setQrError("Servidor de WhatsApp no disponible")
        return
      }
      const json = await res.json()
      if (json.qr) {
        setQrData(json.qr)
        setQrError(null)
        qrPollCount.current = 0
      } else if (json.status === "connected") {
        setLine((l) => ({ ...l, status: "connected" }))
        setShowQR(false)
        qrPollCount.current = 0
      } else if (json.status === "disconnected") {
        setQrError("Sesión desconectada. Cerrá el panel y volvé a escanear.")
      } else {
        // No QR yet (status: connecting/waiting) — track attempts
        qrPollCount.current++
        if (qrPollCount.current >= 6) {
          // ~30s without QR
          setQrError("No se pudo generar el QR. Cerrá y volvé a intentar.")
          qrPollCount.current = 0
        }
      }
    } catch {
      setQrError("No se pudo conectar al servidor de WhatsApp")
    } finally {
      setQrLoading(false)
    }
  }, [line.id])

  // Poll while QR panel is open and not connected
  useEffect(() => {
    if (!showQR || line.status === "connected") return
    fetchQR()
    const interval = setInterval(fetchQR, 5000)
    return () => clearInterval(interval)
  }, [showQR, line.status, fetchQR])

  async function handleStart() {
    setStarting(true)
    try {
      await fetch(`/api/lines/${line.id}/start`, { method: "POST" })
      setShowQR(true)
    } finally {
      setStarting(false)
    }
  }

  async function handleShowQR() {
    if (!showQR) {
      try {
        const res = await fetch(`/api/lines/${line.id}/start`, { method: "POST" })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          toast.error((json as { error?: string }).error || "No se pudo iniciar la sesión de WhatsApp")
          return
        }
        if (json.status === "connected") {
          setLine((l) => ({ ...l, status: "connected" }))
          toast.success("WhatsApp ya está conectado")
          return
        }
      } catch {
        toast.error("Servidor de WhatsApp no disponible")
        return
      }
      setQrData(null)
      setQrError(null)
      qrPollCount.current = 0
    }
    setShowQR(!showQR)
  }

  if (deleted) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${
            line.status === "connected"
              ? "bg-emerald-400"
              : "bg-zinc-600"
          }`} />
          <div>
            {renaming ? (
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRename()
                  if (e.key === "Escape") { setRenaming(false); setNewName(line.name) }
                }}
                className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-white text-sm w-36 focus:outline-none focus:border-emerald-500"
              />
            ) : (
              <p className="text-white font-medium text-sm">{line.name}</p>
            )}
            <p className="text-zinc-500 text-xs">
              {line.phone_number || "No conectado"}
              {line.is_incognito && (
                <span className="ml-2 px-1.5 py-0.5 bg-violet-500/15 text-violet-400 rounded text-xs">
                  Incógnito
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-zinc-500">
              {line.is_active ? (
                <span className="text-emerald-400 font-medium">{line.days_remaining} días</span>
              ) : (
                <span className="text-zinc-600">Inactiva</span>
              )}
            </p>
          </div>

          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            line.status === "connected"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-800 text-zinc-500"
          }`}>
            {line.status === "connected" ? "Conectado" : "Desconectado"}
          </span>

          {line.status !== "connected" && (
            <button
              onClick={handleShowQR}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              {showQR ? "Ocultar QR" : "Escanear QR"}
            </button>
          )}

          {!line.is_active && (
            <button
              onClick={handleStart}
              disabled={starting}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 rounded-lg text-xs text-black font-medium transition-colors"
            >
              {starting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Activar
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
              <MoreHorizontal className="w-4 h-4 text-zinc-500" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setNewName(line.name); setRenaming(true) }}>
                <Pencil className="w-3.5 h-3.5 mr-2" />
                Renombrar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">¿Eliminar línea?</AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  Se eliminará <span className="text-white font-medium">{line.name}</span> y se desconectará el número de WhatsApp. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-500 text-white"
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {showQR && (
        <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col items-center gap-3">
          <div className="w-52 h-52 bg-white rounded-lg flex items-center justify-center overflow-hidden">
            {qrError ? (
              <div className="flex flex-col items-center gap-2 p-4 text-center">
                <QrCode className="w-10 h-10 text-red-400" />
                <p className="text-xs text-red-500">{qrError}</p>
              </div>
            ) : qrData ? (
              <img src={qrData} alt="QR WhatsApp" className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                <p className="text-xs text-zinc-500">Generando QR...</p>
              </div>
            )}
          </div>
          <p className="text-zinc-500 text-xs text-center">
            {qrError
              ? "Verificá que el servidor de WhatsApp esté corriendo"
              : "Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo → Escaneá este QR"}
          </p>
          <button
            onClick={fetchQR}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar QR
          </button>
        </div>
      )}
    </div>
  )
}
