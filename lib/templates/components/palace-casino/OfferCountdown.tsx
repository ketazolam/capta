"use client";

import { useEffect, useState } from "react";
import { storageGet, storageSet } from "./_utils";

const INITIAL_SECONDS = 8 * 60; // 8 minutos — creíble, no se reinicia

export default function OfferCountdown() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    const saved = storageGet("session", "offerCountdownV2");
    const parsed = saved ? parseInt(saved, 10) : NaN;
    const initial = !Number.isNaN(parsed) && parsed > 0 ? parsed : INITIAL_SECONDS;
    setTimeLeft(initial);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) return 0; // se queda en 0, no reinicia
        const next = prev - 1;
        storageSet("session", "offerCountdownV2", next.toString());
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (timeLeft === null) return null;

  const expired = timeLeft === 0;
  const isUrgent = timeLeft <= 60 && !expired;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className={`sticky top-0 z-50 border-b transition-colors ${
        expired
          ? "bg-zinc-800/95 border-zinc-700/30 backdrop-blur-sm"
          : isUrgent
          ? "bg-red-600/95 border-red-400/30"
          : "bg-primary-800/95 border-gold-500/20 backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-2 text-white">
          <span className="text-base">{expired ? "⚠️" : isUrgent ? "🔥" : "⏰"}</span>
          <p className="text-sm sm:text-base font-semibold text-center">
            {expired ? (
              <span className="text-red-300">Tu bono reservado expiró — escribile a Roma para reactivarlo</span>
            ) : (
              <>
                Tu bono reservado expira en:{" "}
                <span
                  className={`font-mono font-bold text-gold-300 ${isUrgent ? "animate-pulse" : ""}`}
                  role="timer"
                  aria-live="polite"
                >
                  {formatTime(timeLeft)}
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
