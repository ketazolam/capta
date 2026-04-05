"use client"

import { ArrowRight, Clock } from "lucide-react"
import { usePalaceConfig } from "./_context"
import { useTracking } from "@/lib/templates/tracking-context"
import ViewersCount from "./ViewersCount"

export default function FinalCTA() {
  const { whatsappUrl } = usePalaceConfig()
  const { redirectToWhatsApp } = useTracking()

  return (
    <section className="section-padding bg-gradient-to-br from-primary-800 via-primary-700 to-primary-800 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container-custom relative z-10">
        <div className="max-w-3xl mx-auto text-center">

          {/* Mirtha quote destacada */}
          <div className="mb-8 px-6 py-5 bg-white/10 backdrop-blur-sm border border-gold-400/30 rounded-2xl">
            <p className="text-gold-300 text-base sm:text-lg font-medium italic leading-relaxed">
              &ldquo;Yo el otro día gané y me compré un anillo de Leiva joyas. Hablen con Roma, la conozco de chiquita y siempre paga.&rdquo;
            </p>
            <p className="text-white/60 text-sm mt-2 font-semibold tracking-wide">— Mirtha Legrand</p>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-xl sm:text-2xl text-white/80 mb-8">
            Tu <span className="text-gold-400 font-semibold">40% de bonificación</span> te está esperando
          </p>

          <button
            onClick={redirectToWhatsApp}
            disabled={!whatsappUrl}
            className="btn-whatsapp text-xl sm:text-2xl px-14 py-6 sm:py-7 min-h-[68px] sm:min-h-[76px] mb-6 group disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9 fill-current" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Hablar con Roma
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <div className="mb-4 flex justify-center">
            <ViewersCount variant="inline" />
          </div>
          <div className="flex items-center justify-center gap-2 text-white/70">
            <Clock className="w-5 h-5" />
            <span>Roma responde en menos de 5 minutos</span>
          </div>
        </div>
      </div>
    </section>
  )
}
