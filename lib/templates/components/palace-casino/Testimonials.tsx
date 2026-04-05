"use client"

import { Star, Quote } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTracking } from "@/lib/templates/tracking-context"

const testimonials = [
  {
    name: "Martín L.",
    age: "34 años",
    timeAsUser: "Jugador hace 8 meses",
    text: "La vi a Mirtha recomendarlo y me animé. Deposité $20.000, me dieron $8.000 de bono y retiré $47.000 en la misma semana. Roma me respondió en 2 minutos, nunca tuve que esperar.",
    highlight: "+$47.000 retirados",
    rating: 5,
  },
  {
    name: "Carolina S.",
    age: "28 años",
    timeAsUser: "Jugadora hace 5 meses",
    text: "Empecé con $5.000, me dieron $2.000 de bono y jugué Aviator. Retiré $31.500 en el día directo a Mercado Pago. Roma te explica todo desde cero, es una genia.",
    highlight: "+$31.500 en el día",
    rating: 5,
  },
  {
    name: "Diego R.",
    age: "45 años",
    timeAsUser: "Jugador hace 1 año",
    text: "Uso Ganamos hace un año. El mes pasado tuve mi mejor racha: deposité $50.000 y retiré $180.000. El pago fue en menos de una hora. Nunca me fallaron.",
    highlight: "+$180.000 retirados",
    rating: 5,
  },
]

export default function Testimonials() {
  const { trackEvent } = useTracking()
  const sectionRef = useRef<HTMLElement>(null)
  const hasTracked = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasTracked.current) {
            hasTracked.current = true
            trackEvent("testimonial_view")
          }
        })
      },
      { threshold: 0.3 }
    )

    const currentSection = sectionRef.current
    if (currentSection) observer.observe(currentSection)
    return () => { if (currentSection) observer.unobserve(currentSection) }
  }, [trackEvent])

  return (
    <section ref={sectionRef} className="section-padding bg-neutral-100">
      <div className="container-custom">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-neutral-900 mb-4">
            Lo Que Dicen Nuestros Jugadores
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Historias reales de usuarios que confían en nosotros
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 lg:p-8 border border-neutral-200 shadow-sm relative"
            >
              <Quote className="absolute top-6 right-6 w-10 h-10 text-primary-100" strokeWidth={1} />

              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                  {testimonial.highlight}
                </span>
              </div>

              <p className="text-neutral-700 leading-relaxed mb-6 relative z-10">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-lg">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">
                    {testimonial.name}, {testimonial.age}
                  </p>
                  <p className="text-sm text-neutral-500">{testimonial.timeAsUser}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
