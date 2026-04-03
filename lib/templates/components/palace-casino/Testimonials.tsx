"use client"

import { Star, Quote } from "lucide-react"
import { useEffect, useRef } from "react"
import { useTracking } from "@/lib/templates/tracking-context"

const testimonials = [
  {
    name: "Martín L.",
    age: "34 años",
    timeAsUser: "Usuario hace 8 meses",
    text: "Probé varios sitios de juego online y este es el único donde cobré sin vueltas. El soporte por WhatsApp es posta, te contestan enseguida y te solucionan todo.",
    rating: 5,
  },
  {
    name: "Carolina S.",
    age: "28 años",
    timeAsUser: "Usuario hace 5 meses",
    text: "Me copa que sea legal y con licencia. Deposité $10.000, me dieron los $5.000 de bono y ya retiré dos veces sin ningún drama. Muy recomendable.",
    rating: 5,
  },
  {
    name: "Diego R.",
    age: "45 años",
    timeAsUser: "Usuario hace 1 año",
    text: "Los bonos diarios están muy buenos, siempre hay algo nuevo. Y las slots andan joya desde el celu. Lo uso casi todos los días.",
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

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />
                ))}
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
