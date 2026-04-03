"use client";

import { useState, useEffect } from "react";
import { Users } from "lucide-react";

interface PlayersOnlineProps {
  variant?: "badge" | "inline" | "hero";
  className?: string;
}

export default function PlayersOnline({ variant = "badge", className = "" }: PlayersOnlineProps) {
  const [count, setCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Número base entre 650-950 (parece realista para una plataforma mediana)
    const baseCount = Math.floor(Math.random() * 300) + 650;
    setCount(baseCount);
    setIsLoaded(true);

    // Fluctuación realista cada 20-40 segundos
    const interval = setInterval(() => {
      setCount(prev => {
        // Cambio de -15 a +20 (leve tendencia positiva)
        const change = Math.floor(Math.random() * 36) - 15;
        const newCount = prev + change;
        // Mantener entre 500 y 1200
        return Math.max(500, Math.min(1200, newCount));
      });
    }, 25000 + Math.random() * 15000);

    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) return null;

  // Variante badge (para TrustBar o header)
  if (variant === "badge") {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <span className="text-sm font-medium text-neutral-700">
          <span className="font-bold text-neutral-900">{count.toLocaleString('es-AR')}</span> jugadores en línea
        </span>
      </div>
    );
  }

  // Variante inline (más compacta)
  if (variant === "inline") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span className="text-xs font-medium">
          {count.toLocaleString('es-AR')} online
        </span>
      </div>
    );
  }

  // Variante hero (para el Hero section, más prominente)
  if (variant === "hero") {
    return (
      <div className={`inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 ${className}`}>
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
        </span>
        <Users className="w-4 h-4 text-white/70" />
        <span className="text-sm font-medium text-white/90">
          <span className="font-bold text-white">{count.toLocaleString('es-AR')}</span> jugadores ahora
        </span>
      </div>
    );
  }

  return null;
}
