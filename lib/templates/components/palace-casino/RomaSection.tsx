"use client"

import { useTracking } from "@/lib/templates/tracking-context"
import { ShieldCheck, Clock, Star } from "lucide-react"

export default function RomaSection() {
  const { redirectToWhatsApp } = useTracking()

  return (
    <section className="section-padding bg-neutral-50 border-y border-neutral-200">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">

            {/* Foto placeholder de Roma */}
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full shadow-xl border-4 border-gold-400/50 overflow-hidden bg-primary-700">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Roma — Cajera oficial"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Online badge */}
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  En línea
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/30 rounded-full px-3 py-1 mb-3">
                <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                <span className="text-gold-700 text-xs font-bold uppercase tracking-wide">Recomendada por Mirtha Legrand</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-neutral-900 mb-1">
                Hola, soy Roma 👋
              </h2>
              <p className="text-primary-600 font-semibold text-sm mb-4">Cajera oficial · La conoce Mirtha de chiquita</p>

              <p className="text-neutral-600 leading-relaxed mb-6">
                Te ayudo a registrarte, elegir entre Ganamos y Zeus, y reclamar tu bono del 40%.
                Respondo en minutos y te acompaño en cada retiro. <strong>Siempre pago.</strong>
              </p>

              <div className="flex flex-wrap justify-center sm:justify-start gap-3 mb-6">
                <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Cajera verificada</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                  <Clock className="w-4 h-4 text-primary-500" />
                  <span>Respondo en &lt; 5 min</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                  <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                  <span>+500 jugadores atendidos</span>
                </div>
              </div>

              <button
                onClick={redirectToWhatsApp}
                className="btn-whatsapp px-8 py-4 text-base sm:text-lg"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Escribirle a Roma ahora
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
