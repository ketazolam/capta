import { Shield, CheckCircle, Lock, Heart } from "lucide-react";

const securityFeatures = [
  {
    icon: Shield,
    text: "Licencia oficial de Lotería de la Ciudad de Buenos Aires",
  },
  {
    icon: CheckCircle,
    text: "Todos los juegos auditados y certificados",
  },
  {
    icon: Lock,
    text: "Tus datos protegidos con encriptación bancaria",
  },
  {
    icon: Heart,
    text: "Política de juego responsable activa",
  },
];

export default function Security() {
  return (
    <section id="seguridad" className="section-padding gradient-primary relative overflow-hidden">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container-custom relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold-500/20 border-2 border-gold-400 mb-8">
            <Shield className="w-10 h-10 text-gold-400" strokeWidth={1.5} />
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white mb-4">
            Tu Seguridad es Nuestra Prioridad
          </h2>

          <p className="text-white/70 text-lg mb-12 max-w-2xl mx-auto">
            Operamos con los más altos estándares de seguridad y transparencia
          </p>

          {/* LOTBA Badge */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8 mb-12 inline-block">
            <div className="flex items-center gap-4 justify-center">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
                <span className="text-primary-800 font-bold text-sm">LOTBA</span>
              </div>
              <div className="text-left">
                <p className="text-white font-semibold text-lg">
                  Plataforma Autorizada
                </p>
                <p className="text-white/70 text-sm">
                  Licencia LOTBA Verificada
                </p>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {securityFeatures.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <feature.icon className="w-6 h-6 text-gold-400 flex-shrink-0" strokeWidth={1.5} />
                <p className="text-white/90 text-left text-sm sm:text-base">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
