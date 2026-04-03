"use client"

import { Gift, MessageSquare, ShieldCheck, Zap } from "lucide-react"
import { usePalaceConfig } from "./_context"


const benefits = [
  {
    icon: Gift,
    title: "Bonos Todos los Días",
    description:
      "No solo en tu primera carga. Tenemos promociones diarias exclusivas para vos.",
  },
  {
    icon: MessageSquare,
    title: "Atención Inmediata",
    description:
      "Soporte real por WhatsApp. Respondemos en minutos, no en días.",
  },
  {
    icon: ShieldCheck,
    title: "100% Legal y Seguro",
    description:
      "Operamos bajo licencia LOTBA. Tu dinero siempre protegido.",
  },
  {
    icon: Zap,
    title: "Pagos Rápidos",
    description:
      "Cobrá tus premios en el día vía Mercado Pago. Sin demoras innecesarias.",
  },
];

export default function Benefits() {
  const { siteName } = usePalaceConfig()
  return (
    <section 
      className="section-padding bg-white"
      aria-labelledby="benefits-title"
    >
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 
            id="benefits-title"
            className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-neutral-900 mb-4 text-balance"
          >
            ¿Por qué elegir {siteName}?
          </h2>
          {/* Mejor contraste: neutral-700 en vez de neutral-600 */}
          <p className="text-neutral-700 text-lg sm:text-xl max-w-2xl mx-auto">
            Transparencia, seguridad y compromiso real con cada jugador
          </p>
        </div>

        {/* Benefits Grid - gap aumentado para mejor separación táctil */}
        <div className="grid md:grid-cols-2 gap-10 lg:gap-14 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <article 
              key={index} 
              className="flex gap-5 sm:gap-6"
            >
              {/* Icono más grande para mejor visibilidad */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <benefit.icon
                    className="w-8 h-8 text-primary-600"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div>
                {/* h3 usa font-sans (Inter) por el CSS global - más legible */}
                <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2 sm:mb-3">
                  {benefit.title}
                </h3>
                {/* Mejor contraste: neutral-700 en vez de neutral-600 */}
                <p className="text-neutral-700 text-base sm:text-lg leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
