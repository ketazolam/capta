"use client"

import { useEffect, useState } from "react"
import {
  getRandomName,
  getWeightedCity,
  getRandomAmount,
  formatMoney,
  getTimeAgo,
} from "./_utils"

interface Deposit {
  id: string
  name: string
  city: string
  amount: number
  timeAgo: string
}

function generateDeposit(index: number): Deposit {
  const { nombre } = getRandomName()
  return {
    id: `dep-${Date.now()}-${index}`,
    name: nombre,
    city: getWeightedCity(),
    amount: getRandomAmount(5000, 50000),
    timeAgo: getTimeAgo(),
  }
}

export default function RecentDeposits() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Generar 5 depositos iniciales
    const initialDeposits = Array.from({ length: 5 }, (_, i) =>
      generateDeposit(i)
    )
    setDeposits(initialDeposits)

    // Agregar nuevo deposito cada 15-20 segundos
    const interval = setInterval(() => {
      setDeposits((prev) => {
        const newDeposit = generateDeposit(prev.length)
        return [newDeposit, ...prev.slice(0, 4)]
      })
    }, Math.random() * 5000 + 15000)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* Desktop: Sidebar */}
      <div className="hidden lg:block fixed right-4 top-24 w-80 z-30">
        <div className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl shadow-2xl border border-primary-700 overflow-hidden">
          {/* Header */}
          <div className="bg-primary-950 px-4 py-3 border-b border-primary-700">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <h3 className="text-white font-bold text-sm">
                Actividad Reciente
              </h3>
            </div>
          </div>

          {/* Deposits List */}
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {deposits.map((deposit, index) => (
              <div
                key={deposit.id}
                className="bg-primary-800/50 rounded-lg p-3 border border-primary-700 animate-slide-down"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">
                      {deposit.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {deposit.name}
                    </p>
                    <p className="text-neutral-400 text-xs">
                      de {deposit.city}
                    </p>
                    <p className="text-green-400 font-bold text-sm mt-1">
                      cargó {formatMoney(deposit.amount)}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">
                      {deposit.timeAgo}
                    </p>
                  </div>
                  <div className="text-green-500">🟢</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile: Collapsible Bottom Banner */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        <div className="bg-gradient-to-br from-primary-900 to-primary-800 border-t border-primary-700 shadow-2xl">
          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full px-4 py-3 flex items-center justify-between text-white"
          >
            <div className="flex items-center gap-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <span className="font-bold text-sm">Actividad Reciente</span>
              <span className="text-neutral-400 text-xs">
                ({deposits.length})
              </span>
            </div>
            <svg
              className={`w-5 h-5 transition-transform ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>

          {/* Collapsed Content */}
          {!isCollapsed && (
            <div className="px-4 pb-4 space-y-2 max-h-64 overflow-y-auto">
              {deposits.slice(0, 3).map((deposit) => (
                <div
                  key={deposit.id}
                  className="bg-primary-800/50 rounded-lg p-2 border border-primary-700 flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-xs">
                      {deposit.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">
                      {deposit.name} de {deposit.city}
                    </p>
                    <p className="text-green-400 font-bold text-xs">
                      {formatMoney(deposit.amount)} &bull; {deposit.timeAgo}
                    </p>
                  </div>
                  <div className="text-green-500 text-sm">🟢</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
