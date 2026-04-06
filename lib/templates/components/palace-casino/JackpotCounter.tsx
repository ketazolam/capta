"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "./_utils";
import { storageGet, storageSet } from "./_utils";

export default function JackpotCounter() {
  const [jackpot, setJackpot] = useState(0);

  useEffect(() => {
    // Obtener valor inicial del localStorage o generar uno nuevo
    const savedJackpot = storageGet("local", "jackpotValue");
    const initialValue = savedJackpot
      ? parseInt(savedJackpot, 10)
      : Math.floor(Math.random() * 5000000) + 10000000; // 10M - 15M

    setJackpot(initialValue);

    // Incrementar el jackpot cada 2-5 segundos
    const interval = setInterval(() => {
      setJackpot((prev) => {
        const increment = Math.floor(Math.random() * 150) + 50; // +50-200
        const newValue = prev + increment;
        storageSet("local", "jackpotValue", newValue.toString());
        return newValue;
      });
    }, Math.random() * 3000 + 2000); // 2-5 segundos

    return () => clearInterval(interval);
  }, []);

  // Animación de contador - separar cada dígito
  const formatJackpotDisplay = (value: number) => {
    const formatted = formatMoney(value).replace(/\$/g, "").replace(/\./g, ",");
    return formatted;
  };

  return (
    <div className="bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 py-6 px-4 text-center relative overflow-hidden">
      {/* Efecto de brillo animado */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />

      <div className="relative z-10">
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="text-3xl">🏆</span>
          <h3 className="text-xl font-bold text-primary-900 uppercase tracking-wide">
            Premio Acumulado
          </h3>
        </div>

        <div
          className="text-5xl md:text-6xl font-black text-white drop-shadow-lg mb-2 font-mono tracking-wider"
          role="status"
          aria-live="polite"
        >
          ${formatJackpotDisplay(jackpot)}
        </div>

        <div className="flex items-center justify-center gap-1 text-primary-900 font-semibold">
          <svg
            className="w-4 h-4 animate-bounce"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">Crece cada segundo</span>
        </div>
      </div>
    </div>
  );
}
