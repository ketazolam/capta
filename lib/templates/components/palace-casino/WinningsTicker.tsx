"use client";

// import from _utils:
import { useEffect, useState } from "react";
// import from _utils:
import {
  getRandomName,
  getWeightedCity,
  getRandomAmount,
  formatMoney,
  getRandomItem,
  juegosPopulares,
} from "./_utils";

interface WinningItem {
  id: string;
  name: string;
  city: string;
  amount: number;
  game: string;
  emoji: string;
}

const emojis = ["🏆", "💰", "🎰", "🎉", "💎", "🔥", "⭐", "🎊"];

export default function WinningsTicker() {
  const [winnings, setWinnings] = useState<WinningItem[]>([]);

  useEffect(() => {
    // Generar 10 items al montar
    const items: WinningItem[] = [];
    for (let i = 0; i < 10; i++) {
      const { nombre } = getRandomName();
      const city = getWeightedCity();
      const amount = getRandomAmount(3000, 50000);
      const game = getRandomItem(
        juegosPopulares.filter((j) => j.popular)
      ).nombre;
      const emoji = getRandomItem(emojis);

      items.push({
        id: `win-${i}`,
        name: nombre,
        city,
        amount,
        game,
        emoji,
      });
    }
    setWinnings(items);
  }, []);

  if (winnings.length === 0) return null;

  return (
    <div className="bg-primary-900 border-y border-primary-800 py-3 overflow-hidden">
      <div className="relative">
        <div className="flex animate-marquee hover:pause-marquee">
          {/* Primera copia */}
          {winnings.map((win) => (
            <div
              key={win.id}
              className="flex items-center whitespace-nowrap px-8 text-white"
            >
              <span className="text-xl mr-2">{win.emoji}</span>
              <span className="text-sm">
                <span className="font-semibold">{win.name}</span> de{" "}
                <span className="text-gold-400">{win.city}</span> ganó{" "}
                <span className="font-bold text-green-400">
                  {formatMoney(win.amount)}
                </span>{" "}
                en {win.game}
              </span>
              <span className="mx-4 text-primary-600">•</span>
            </div>
          ))}
          {/* Segunda copia para loop seamless */}
          {winnings.map((win) => (
            <div
              key={`${win.id}-duplicate`}
              className="flex items-center whitespace-nowrap px-8 text-white"
            >
              <span className="text-xl mr-2">{win.emoji}</span>
              <span className="text-sm">
                <span className="font-semibold">{win.name}</span> de{" "}
                <span className="text-gold-400">{win.city}</span> ganó{" "}
                <span className="font-bold text-green-400">
                  {formatMoney(win.amount)}
                </span>{" "}
                en {win.game}
              </span>
              <span className="mx-4 text-primary-600">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
