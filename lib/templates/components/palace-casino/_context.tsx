"use client"

// Adapter context — replaces ContactConfigProvider from the original palace-landing.
// Reads waPhone + waMessage from TemplateProps (passed by Capta's server component)
// and exposes the same interface as the original useContactConfig() hook.

import { createContext, useContext, useMemo, type ReactNode } from "react"

export type PalaceConfigState = {
  whatsappNumber: string
  whatsappMessage: string
  whatsappUrl: string
  getWhatsAppUrlForGame: (gameName: string) => string
  isLoading: boolean
  siteName: string
}

const PalaceConfigContext = createContext<PalaceConfigState | null>(null)

export function PalaceConfigProvider({
  waPhone,
  waMessage,
  siteName,
  children,
}: {
  waPhone: string | null
  waMessage: string
  siteName?: string
  children: ReactNode
}) {
  const value = useMemo<PalaceConfigState>(() => {
    const number = waPhone ?? ""
    const message = waMessage || "Hola! Quiero recibir informacion."
    const gameMsg = `Hola! Quiero informacion sobre {game}.`
    return {
      whatsappNumber: number,
      whatsappMessage: message,
      whatsappUrl: number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : "",
      getWhatsAppUrlForGame: (gameName: string) =>
        number
          ? `https://wa.me/${number}?text=${encodeURIComponent(gameMsg.replace("{game}", gameName))}`
          : "",
      isLoading: false,
      siteName: siteName || "Palace Casino",
    }
  }, [waPhone, waMessage, siteName])

  return (
    <PalaceConfigContext.Provider value={value}>
      {children}
    </PalaceConfigContext.Provider>
  )
}

export function usePalaceConfig(): PalaceConfigState {
  const ctx = useContext(PalaceConfigContext)
  if (!ctx) throw new Error("usePalaceConfig must be used inside PalaceConfigProvider")
  return ctx
}
