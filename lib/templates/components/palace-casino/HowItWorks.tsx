import { MessageCircle, Wallet, Gift } from "lucide-react";


const steps = [
  {
    number: "1",
    icon: MessageCircle,
    title: "Escribinos",
    description: "Contactanos por WhatsApp. Te guiamos en el registro en menos de 5 minutos.",
  },
  {
    number: "2",
    icon: Wallet,
    title: "Hacé tu primera carga",
    description: `Depositá desde $3.000 con Mercado Pago. Rápido, seguro y sin comisiones.`,
  },
  {
    number: "3",
    icon: Gift,
    title: "Recibí tu 50%",
    description: "Tu bonificación se acredita al instante. Empezá a jugar de inmediato.",
  },
];

export default function HowItWorks() {
  return (
    <section className="section-padding bg-white" id="como-funciona">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-neutral-900 mb-4">
            Activá tu bono en 3 pasos
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto">
            Sin vueltas, sin complicaciones
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12 relative">
          {/* Connection line - desktop only */}
          <div className="hidden md:block absolute top-20 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />

          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="card text-center hover:border-primary-200 group">
                {/* Step number */}
                <div className="w-14 h-14 rounded-full bg-primary-600 text-white font-bold text-xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
                  <step.icon className="w-8 h-8 text-gold-500" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-serif font-bold text-neutral-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Mobile connector */}
              {index < steps.length - 1 && (
                <div className="md:hidden flex justify-center py-4">
                  <div className="w-0.5 h-8 bg-primary-200" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
