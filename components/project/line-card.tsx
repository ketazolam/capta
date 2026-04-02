"use client"

import { useState } from "react"
import { MoreHorizontal, Zap, QrCode, RefreshCw } from "lucide-react"

interface Line {
  id: string
  name: string
  phone_number: string | null
  status: string
  is_active: boolean
  is_incognito: boolean
  days_remaining: number
}

export default function LineCard({ line }: { line: Line }) {
  const [showQR, setShowQR] = useState(false)

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
            <p className="text-white font-medium text-sm">{line.name}</p>
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
          {/* Days remaining */}
          <div className="text-right">
            <p className="text-xs text-zinc-500">
              {line.is_active ? (
                <span className="text-emerald-400 font-medium">{line.days_remaining} días</span>
              ) : (
                <span className="text-zinc-600">Inactiva</span>
              )}
            </p>
          </div>

          {/* Status badge */}
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
            line.status === "connected"
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-800 text-zinc-500"
          }`}>
            {line.status === "connected" ? "Conectado" : "Desconectado"}
          </span>

          {/* QR button */}
          {line.status !== "connected" && (
            <button
              onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-xs text-zinc-300 transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              Escanear QR
            </button>
          )}

          {/* Activate */}
          {!line.is_active && (
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-xs text-black font-medium transition-colors">
              <Zap className="w-3.5 h-3.5" />
              Activar
            </button>
          )}

          <button className="p-1.5 hover:bg-zinc-800 rounded-lg transition-colors">
            <MoreHorizontal className="w-4 h-4 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* QR Panel */}
      {showQR && (
        <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col items-center gap-3">
          <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center">
            <QrCode className="w-24 h-24 text-zinc-900" />
          </div>
          <p className="text-zinc-500 text-xs text-center">
            Abrí WhatsApp → Dispositivos vinculados → Vincular dispositivo → Escaneá este QR
          </p>
          <button className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
            Regenerar QR
          </button>
        </div>
      )}
    </div>
  )
}
