"use client"

import { useState } from "react"
import Image from "next/image"
import { Play, Users, Star, TrendingUp } from "lucide-react"
import { usePalaceConfig } from "./_context"
import { useTracking } from "@/lib/templates/tracking-context"

const GAME_IMAGES: Record<string, string> = {
  "sweet-bonanza": "/media/item-01.jpg",
  "aviator": "/media/item-02.jpg",
  "gates-olympus": "/media/item-03.jpg",
  "fortune-tiger": "/media/item-04.jpg",
  "ruleta-vivo": "/media/item-05.jpg",
  "spaceman": "/media/item-06.jpg",
}

const gamePlaceholders: Record<string, { gradient: string; emoji: string }> = {
  "sweet-bonanza": { gradient: "from-pink-600 via-rose-500 to-amber-400", emoji: "🍬" },
  "aviator": { gradient: "from-sky-600 via-blue-500 to-indigo-600", emoji: "✈️" },
  "gates-olympus": { gradient: "from-amber-500 via-yellow-400 to-amber-600", emoji: "⚡" },
  "fortune-tiger": { gradient: "from-emerald-600 via-green-500 to-teal-600", emoji: "🐯" },
  "ruleta-vivo": { gradient: "from-violet-600 via-purple-500 to-fuchsia-500", emoji: "🎡" },
  "spaceman": { gradient: "from-slate-700 via-indigo-600 to-purple-700", emoji: "🚀" },
}

const featuredGames = [
  { id: "sweet-bonanza", analyticsId: "item_01", name: "Sweet Bonanza", provider: "Pragmatic Play", category: "Slots", badge: "Popular", badgeColor: "bg-red-500", players: 234, rating: 4.9 },
  { id: "aviator", analyticsId: "item_02", name: "Aviator", provider: "Spribe", category: "Crash", badge: "Trending", badgeColor: "bg-orange-500", players: 456, rating: 4.8 },
  { id: "gates-olympus", analyticsId: "item_03", name: "Gates of Olympus", provider: "Pragmatic Play", category: "Slots", badge: "Hot", badgeColor: "bg-yellow-500", players: 189, rating: 4.9 },
  { id: "fortune-tiger", analyticsId: "item_04", name: "Fortune Tiger", provider: "PG Soft", category: "Slots", badge: "Nuevo", badgeColor: "bg-green-500", players: 312, rating: 4.7 },
  { id: "ruleta-vivo", analyticsId: "item_05", name: "Ruleta en Vivo", provider: "Evolution", category: "Juegos en Vivo", badge: "VIP", badgeColor: "bg-purple-500", players: 89, rating: 4.9 },
  { id: "spaceman", analyticsId: "item_06", name: "Spaceman", provider: "Pragmatic Play", category: "Crash", badge: null, badgeColor: "", players: 156, rating: 4.6 },
]

const categories = ["Todos", "Slots", "Crash", "Juegos en Vivo"]

function GameCardPlaceholder({ gameId, gameName }: { gameId: string; gameName: string }) {
  const style = gamePlaceholders[gameId] || { gradient: "from-primary-600 to-primary-800", emoji: "🎰" }
  return (
    <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
      <div className="text-center px-4">
        <span className="text-5xl sm:text-6xl drop-shadow-lg block mb-2" role="img" aria-hidden>{style.emoji}</span>
        <span className="text-white font-bold text-lg sm:text-xl drop-shadow-md">{gameName}</span>
      </div>
    </div>
  )
}

export default function GamesShowcase() {
  const { whatsappUrl, getWhatsAppUrlForGame } = usePalaceConfig()
  const { trackEvent } = useTracking()
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({})

  const handlePlay = async (gameName?: string, trackingItemId?: string) => {
    const url = gameName ? getWhatsAppUrlForGame(gameName) : whatsappUrl
    await trackEvent("wa_click", gameName
      ? { source: "CTA item", itemId: trackingItemId }
      : { source: "CTA listado" }
    )
    if (url) window.location.href = url
  }

  const filteredGames = activeCategory === "Todos"
    ? featuredGames
    : featuredGames.filter((game) => game.category === activeCategory)

  return (
    <section className="section-padding bg-neutral-100" id="juegos">
      <div className="container-custom">
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-neutral-900 mb-4">
            Juegos Destacados
          </h2>
          <p className="text-neutral-600 text-lg max-w-2xl mx-auto mb-8">
            Más de 500 juegos de los mejores proveedores. Elegí tu favorito y empezá a ganar.
          </p>

          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === category
                    ? "bg-primary-600 text-white shadow-lg"
                    : "bg-white text-neutral-600 hover:bg-primary-50 hover:text-primary-600 border border-neutral-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {filteredGames.map((game) => (
            <div
              key={game.id}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-primary-900">
                {GAME_IMAGES[game.id] && !imageErrors[game.id] ? (
                  <Image
                    src={GAME_IMAGES[game.id]}
                    alt="Imagen destacada"
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    onError={() => setImageErrors((prev) => ({ ...prev, [game.id]: true }))}
                  />
                ) : (
                  <GameCardPlaceholder gameId={game.id} gameName={game.name} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {game.badge && (
                  <div className={`absolute top-3 left-3 ${game.badgeColor} text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1`}>
                    {game.badge === "Trending" && <TrendingUp className="w-3 h-3" />}
                    {game.badge === "Popular" && <Star className="w-3 h-3 fill-current" />}
                    {game.badge}
                  </div>
                )}

                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {game.players} jugando
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button
                    onClick={() => handlePlay(game.name, game.analyticsId)}
                    className="bg-whatsapp hover:bg-green-600 text-white font-bold px-8 py-4 rounded-xl shadow-2xl flex items-center gap-3 transform scale-90 group-hover:scale-100 transition-transform duration-300 min-h-[56px] text-base sm:text-lg"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    Jugar Ahora
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">
                      {game.name}
                    </h3>
                    <p className="text-sm text-neutral-500">{game.provider}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium text-neutral-700">{game.rating}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full font-medium">
                    {game.category}
                  </span>
                  <span className="text-xs text-neutral-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {game.players} online
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-neutral-500 mb-5 text-lg">¿Querés ver los más de 500 juegos disponibles?</p>
          <button
            onClick={() => handlePlay()}
            className="btn-whatsapp text-lg sm:text-xl px-10 sm:px-14 py-5 sm:py-6 min-h-[60px] sm:min-h-[64px]"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Ver Todos los Juegos
          </button>
        </div>
      </div>
    </section>
  )
}
