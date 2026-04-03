"use client"

import { useEffect } from "react"
import { TrackingProvider, useTracking } from "@/lib/templates/tracking-context"
import type { TemplateDefinition, TemplateProps } from "@/lib/templates/types"

function WhatsAppRedirectInner({
  autoRedirect,
  config,
}: Pick<TemplateProps, "autoRedirect" | "config">) {
  const { redirectToWhatsApp, waUrl } = useTracking()

  const buttonText = (config.buttonText as string) || "Ir a WhatsApp ahora"
  const headlineText = (config.headlineText as string) || (autoRedirect ? "Redirigiendo a WhatsApp..." : "Ir a WhatsApp")
  const bgColor = (config.backgroundColor as string) || "#0a0a0a"
  const accentColor = (config.accentColor as string) || "#22c55e"

  useEffect(() => {
    if (autoRedirect && waUrl) {
      const timer = setTimeout(() => { redirectToWhatsApp() }, 1500)
      return () => clearTimeout(timer)
    }
  }, [autoRedirect, waUrl, redirectToWhatsApp])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: bgColor }}>
      <div className="text-center space-y-6 max-w-sm w-full">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: accentColor }}>
          <svg viewBox="0 0 24 24" className="w-9 h-9 fill-black" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.557 4.12 1.529 5.849L0 24l6.335-1.508A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.644-.524-5.148-1.432L3 21.5l.968-3.72A9.962 9.962 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
          </svg>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white">{headlineText}</h1>
          {autoRedirect && (
            <p className="text-zinc-500 text-sm">En unos segundos se abrirá el chat. Si no se abre, usá el botón.</p>
          )}
        </div>

        {autoRedirect && (
          <div className="w-full bg-zinc-800 rounded-full h-1">
            <div
              className="h-1 rounded-full"
              style={{
                background: accentColor,
                width: "0%",
                animation: "grow 1.5s ease-in-out forwards",
              }}
            />
          </div>
        )}

        <button
          onClick={redirectToWhatsApp}
          disabled={!waUrl}
          className="w-full py-3.5 font-semibold rounded-xl transition-colors disabled:opacity-50 text-black"
          style={{ background: accentColor }}
        >
          {buttonText}
        </button>

        {!waUrl && (
          <p className="text-zinc-600 text-xs">No hay líneas activas disponibles</p>
        )}
      </div>
      <style>{`@keyframes grow { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  )
}

export function WhatsAppRedirectTemplate(props: TemplateProps) {
  return (
    <TrackingProvider
      pageId={props.pageId}
      projectId={props.projectId}
      sessionId={props.sessionId}
      lineId={props.lineId}
      waPhone={props.waPhone}
      waMessage={props.waMessage}
      fbp={props.fbp}
      fbc={props.fbc}
    >
      <WhatsAppRedirectInner autoRedirect={props.autoRedirect} config={props.config} />
    </TrackingProvider>
  )
}

export const WhatsAppRedirectDefinition: TemplateDefinition = {
  id: "whatsapp-redirect",
  name: "Redirect WhatsApp",
  description: "Pantalla simple que redirige al usuario a WhatsApp automáticamente.",
  configSchema: [
    { key: "headlineText", label: "Título", type: "text", placeholder: "Redirigiendo a WhatsApp..." },
    { key: "buttonText", label: "Texto del botón", type: "text", placeholder: "Ir a WhatsApp ahora" },
    { key: "backgroundColor", label: "Color de fondo", type: "color", default: "#0a0a0a" },
    { key: "accentColor", label: "Color de acento", type: "color", default: "#22c55e" },
  ],
  component: WhatsAppRedirectTemplate,
}
