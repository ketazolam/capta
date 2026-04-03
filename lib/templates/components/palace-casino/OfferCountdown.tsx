"use client";

import { useEffect, useState } from "react";
import { storageGet, storageRemove, storageSet } from "./_utils";

export default function OfferCountdown() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);

  const MAX_SECONDS = 60; // 1 minuto

  useEffect(() => {
    // Siempre máximo 1 minuto: si hay valor guardado > 60 (versión vieja), lo descartamos
    const saved = storageGet("session", "offerCountdown");
    const parsed = saved ? parseInt(saved, 10) : NaN;
    if (Number.isNaN(parsed) || parsed > MAX_SECONDS) {
      storageRemove("session", "offerCountdown");
    }
    const initialTime = Number.isNaN(parsed) || parsed > MAX_SECONDS ? MAX_SECONDS : parsed;

    setTimeLeft(initialTime);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          storageRemove("session", "offerCountdown");
          return MAX_SECONDS;
        }

        const newTime = prev - 1;
        storageSet("session", "offerCountdown", newTime.toString());

        // Urgente cuando quedan menos de 15 segundos
        if (newTime <= 15) {
          setIsUrgent(true);
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isLastChance = timeLeft === MAX_SECONDS;

  return (
    <div
      className={`sticky top-0 z-50 transition-colors border-b ${
        isUrgent
          ? "bg-red-500/90 border-red-400/30"
          : "bg-primary-800/95 border-gold-500/20 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4 py-1.5">
        <div className="flex items-center justify-center gap-2 text-white/95">
          <span className={`text-sm ${isUrgent ? "animate-pulse" : ""}`}>
            {isUrgent ? "🔥" : "⏰"}
          </span>
          <div className="text-center">
            {isLastChance ? (
              <p className="font-medium text-xs sm:text-sm animate-pulse">
                ¡Última oportunidad!
              </p>
            ) : (
              <p className="text-xs sm:text-sm font-medium">
                Tu bono reservado:{" "}
                <span
                  className={`font-mono text-sm sm:text-base ${
                    isUrgent ? "animate-pulse" : ""
                  }`}
                  role="timer"
                  aria-live="polite"
                >
                  {formatTime(timeLeft)}
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
