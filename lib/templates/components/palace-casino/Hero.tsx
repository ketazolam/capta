"use client"

import { ArrowRight, Clock, Banknote } from "lucide-react"
import { useTracking } from "@/lib/templates/tracking-context"
import Logo from "./Logo"
import PlayersOnline from "./PlayersOnline"
import ViewersCount from "./ViewersCount"

export default function Hero() {
  const { redirectToWhatsApp } = useTracking()

  return (
    <section
      // Mobile: altura exacta del viewport menos el countdown (~52px), overflow-hidden para clippear la quote
      // Desktop: min-h normal
      className="relative h-[calc(100dvh-52px)] sm:h-auto sm:min-h-[90vh] flex flex-col sm:items-center sm:justify-center gradient-primary overflow-hidden"
      aria-labelledby="hero-headline"
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C%2Fg%3E%3C%2Fsvg%3E")`,
        }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/30 via-transparent to-primary-900/50" aria-hidden="true" />

      {/* Mobile: flex-col que divide espacio entre contenido principal y quote */}
      <div className="relative z-10 w-full flex-1 flex flex-col sm:block container-custom px-5 pt-6 pb-0 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
        <div className="max-w-3xl mx-auto text-center flex-1 flex flex-col sm:block">

          {/* Contenido principal — ocupa todo el espacio disponible y centra verticalmente */}
          <div className="flex-1 flex flex-col items-center justify-center sm:block">
            <div className="flex justify-center mb-6 sm:mb-10">
              <Logo />
            </div>

            <h1
              id="hero-headline"
              className="text-[2.4rem] sm:text-5xl lg:text-6xl font-bold uppercase tracking-wide text-white mb-6 sm:mb-6 leading-tight max-w-[20ch] mx-auto"
            >
              Reclamá tu bono del
              <span className="text-gradient block mt-1">40% ahora</span>
            </h1>

            <button
              onClick={redirectToWhatsApp}
              className="btn-whatsapp w-full max-w-md mx-auto text-[1.55rem] sm:text-2xl px-8 sm:px-16 py-6 sm:py-7 min-h-[76px] sm:min-h-[76px] mb-4 sm:mb-6 group animate-pulse-slow"
              aria-label="Hablar con Roma"
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 sm:w-9 sm:h-9 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              <span>Hablar con Roma</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform flex-shrink-0" aria-hidden="true" />
            </button>

            <p className="text-white/85 text-base sm:text-base font-semibold sm:mb-6">
              Roma es cajera oficial • Siempre paga
            </p>

            {/* Desktop-only badges */}
            <div className="hidden sm:flex flex-wrap justify-center gap-4 mt-6 mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Clock className="w-5 h-5 text-gold-400" />
                <span className="text-white text-sm font-medium">Soporte 24hs</span>
              </div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Banknote className="w-5 h-5 text-gold-400" />
                <span className="text-white text-sm font-medium">Pagos en el día</span>
              </div>
            </div>

            <div className="hidden sm:flex mb-4 justify-center">
              <ViewersCount variant="badge" />
            </div>
            <div className="hidden sm:block">
              <PlayersOnline variant="hero" />
            </div>
          </div>

          {/* Quote de Mirtha — en mobile se pushea al fondo y asoma (translate-y la deja medio cortada) */}
          <div className="translate-y-6 sm:translate-y-0 sm:mt-8 px-1 pb-0">
            <div className="inline-block w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-gold-400/30 rounded-2xl">
              <p className="text-gold-300 text-sm sm:text-base font-medium italic leading-relaxed">
                &ldquo;Si querés jugar en un casino online de verdad, con respuesta garantizada... son de mi absoluta confianza.&rdquo;
              </p>
              <p className="text-white/60 text-xs sm:text-sm mt-1.5 font-semibold tracking-wide">— Mirtha Legrand</p>
            </div>
          </div>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" aria-hidden="true" />
    </section>
  )
}
