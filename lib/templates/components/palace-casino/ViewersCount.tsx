"use client";

import { useEffect, useState } from "react";

interface ViewersCountProps {
  variant?: "inline" | "badge";
}

export default function ViewersCount({ variant = "inline" }: ViewersCountProps) {
  const [viewers, setViewers] = useState(0);

  useEffect(() => {
    // Número base aleatorio entre 35 y 65
    const baseViewers = Math.floor(Math.random() * 30) + 35;
    setViewers(baseViewers);

    // Fluctuar el número cada 10-20 segundos
    const interval = setInterval(() => {
      setViewers((prev) => {
        const change = Math.floor(Math.random() * 10) - 5; // -5 a +5
        const newValue = Math.max(30, Math.min(80, prev + change)); // Mantener entre 30-80
        return newValue;
      });
    }, Math.random() * 10000 + 10000); // 10-20 segundos

    return () => clearInterval(interval);
  }, []);

  if (variant === "badge") {
    return (
      <div className="inline-flex items-center gap-2 bg-primary-800/50 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm border border-primary-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <span role="status" aria-live="polite">
          {viewers} viendo ahora
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 text-neutral-300"
      role="status"
      aria-live="polite"
    >
      <span className="text-xl">👀</span>
      <span className="text-sm">
        <span className="font-bold text-white">{viewers} personas</span> están
        viendo esta página
      </span>
    </div>
  );
}
