import { Award, Shield, Headphones, CreditCard } from "lucide-react";

const trustItems = [
  {
    icon: Award,
    title: "+5 Años",
    subtitle: "de Experiencia",
  },
  {
    icon: Shield,
    title: "Licencia LOTBA",
    subtitle: "Verificada",
  },
  {
    icon: Headphones,
    title: "Soporte 24/7",
    subtitle: "Por WhatsApp",
  },
  {
    icon: CreditCard,
    title: "Mercado Pago",
    subtitle: "Pagos Seguros",
  },
];

export default function TrustBar() {
  return (
    <section className="bg-neutral-100 py-8 sm:py-10 border-b border-neutral-200">
      <div className="container-custom px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {trustItems.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-primary-100 flex items-center justify-center">
                <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold text-neutral-900 text-sm sm:text-base">
                  {item.title}
                </p>
                <p className="text-neutral-600 text-xs sm:text-sm">
                  {item.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
