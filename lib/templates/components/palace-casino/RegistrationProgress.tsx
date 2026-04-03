"use client"

import { useEffect, useState } from "react"
import { useTracking } from "@/lib/templates/tracking-context"
import { usePalaceConfig } from "./_context"
import { storageGet, storageSet } from "./_utils"

interface Step {
  id: number
  label: string
  completed: boolean
  isCTA?: boolean
}

export default function RegistrationProgress() {
  const { whatsappUrl } = usePalaceConfig()
  const { redirectToWhatsApp } = useTracking()
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Verificar si fue cerrado
    const dismissed = storageGet("session", "progressBarDismissed")
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    // Mostrar despues de 10 segundos
    const visibilityTimer = setTimeout(() => {
      setIsVisible(true)
    }, 10000)

    // Trackear scroll
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollPercent =
        (scrollTop / (documentHeight - windowHeight)) * 100
      setScrollProgress(Math.min(100, scrollPercent))
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      clearTimeout(visibilityTimer)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const steps: Step[] = [
    { id: 1, label: "Visitaste la pagina", completed: true },
    { id: 2, label: "Exploraste los juegos", completed: scrollProgress > 30 },
    {
      id: 3,
      label: "Conociste los beneficios",
      completed: scrollProgress > 60,
    },
    { id: 4, label: "Contactanos por WhatsApp", completed: false, isCTA: true },
  ]

  const completedSteps = steps.filter((s) => s.completed).length
  const progressPercentage = (completedSteps / steps.length) * 100

  const handleDismiss = () => {
    setIsDismissed(true)
    storageSet("session", "progressBarDismissed", "true")
  }

  const handleCTA = () => {
    redirectToWhatsApp()
  }

  if (!isVisible || isDismissed) return null

  return (
    <div className="fixed bottom-24 right-4 md:bottom-4 md:right-4 z-40 max-w-sm w-full md:w-80 animate-slide-in">
      <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl shadow-2xl border border-primary-700 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-primary-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-white font-bold">
              {completedSteps}
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Tu Progreso</h3>
              <p className="text-neutral-400 text-xs">
                {progressPercentage.toFixed(0)}% completado
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-neutral-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-4 py-3 bg-primary-950">
          <div className="w-full bg-primary-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-gold-600 to-gold-400 h-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="p-4 space-y-3">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-3">
              {/* Checkmark or number */}
              <div
                className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step.completed
                    ? "bg-green-500 text-white"
                    : "bg-primary-700 text-neutral-400"
                }`}
              >
                {step.completed ? (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>

              {/* Label */}
              {step.isCTA ? (
                <button
                  onClick={handleCTA}
                  className="flex-1 bg-whatsapp hover:bg-whatsapp-dark text-white font-bold py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {step.label}
                </button>
              ) : (
                <span
                  className={`text-sm ${
                    step.completed ? "text-white font-medium" : "text-neutral-400"
                  }`}
                >
                  {step.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
