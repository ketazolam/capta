"use client"

import { useState, useEffect, useCallback } from "react"
import { X, Trophy, Banknote, Gift, Gamepad2 } from "lucide-react"
import {
  getRandomName,
  getWeightedCity,
  getRandomAmount,
  formatMoney,
  getTimeAgo,
  getRandomItem,
  juegosPopulares,
} from "./_utils"

type NotificationType = "withdrawal" | "win" | "bonus" | "playing"

interface Notification {
  id: number
  type: NotificationType
  name: string
  inicial: string
  city: string
  amount?: string
  game?: string
  timeAgo: string
}

const notificationConfig: Record<
  NotificationType,
  {
    icon: typeof Trophy
    bgColor: string
    iconColor: string
    getMessage: (n: Notification) => string
  }
> = {
  withdrawal: {
    icon: Banknote,
    bgColor: "bg-green-500",
    iconColor: "text-white",
    getMessage: (n) => `retiró ${n.amount}`,
  },
  win: {
    icon: Trophy,
    bgColor: "bg-yellow-500",
    iconColor: "text-white",
    getMessage: (n) => `ganó ${n.amount} en ${n.game}`,
  },
  bonus: {
    icon: Gift,
    bgColor: "bg-purple-500",
    iconColor: "text-white",
    getMessage: () => `activó su bono del 50%`,
  },
  playing: {
    icon: Gamepad2,
    bgColor: "bg-blue-500",
    iconColor: "text-white",
    getMessage: (n) => `está jugando ${n.game}`,
  },
}

const notificationWeights: { type: NotificationType; weight: number }[] = [
  { type: "withdrawal", weight: 25 },
  { type: "win", weight: 35 },
  { type: "bonus", weight: 25 },
  { type: "playing", weight: 15 },
]

function getRandomNotificationType(): NotificationType {
  const totalWeight = notificationWeights.reduce((sum, n) => sum + n.weight, 0)
  let random = Math.random() * totalWeight
  for (const item of notificationWeights) {
    random -= item.weight
    if (random <= 0) return item.type
  }
  return "win"
}

function generateNotification(id: number): Notification {
  const type = getRandomNotificationType()
  const { nombre, inicial } = getRandomName()
  const city = getWeightedCity()
  const timeAgo = getTimeAgo()

  let amount: string | undefined
  let game: string | undefined

  switch (type) {
    case "withdrawal":
      amount = formatMoney(getRandomAmount(15000, 150000))
      break
    case "win":
      amount = formatMoney(getRandomAmount(5000, 80000))
      game = getRandomItem(juegosPopulares.filter((j) => j.popular)).nombre
      break
    case "bonus":
      break
    case "playing":
      game = getRandomItem(juegosPopulares).nombre
      break
  }

  return { id, type, name: nombre, inicial, city, amount, game, timeAgo }
}

export default function LiveNotifications() {
  const [notification, setNotification] = useState<Notification | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [notificationCount, setNotificationCount] = useState(0)

  const showNotification = useCallback(() => {
    if (!isEnabled) return
    const newNotification = generateNotification(Date.now())
    setNotification(newNotification)
    setIsVisible(true)
    setNotificationCount((prev) => prev + 1)
    setTimeout(() => setIsVisible(false), 5000)
  }, [isEnabled])

  useEffect(() => {
    const initialDelay = 5000 + Math.random() * 3000
    const initialTimer = setTimeout(showNotification, initialDelay)
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 8000
      setTimeout(showNotification, randomDelay)
    }, 12000)
    return () => {
      clearTimeout(initialTimer)
      clearInterval(interval)
    }
  }, [showNotification])

  if (!notification || !isVisible) return null

  const config = notificationConfig[notification.type]
  const Icon = config.icon

  return (
    <div
      className="fixed bottom-20 left-2 sm:bottom-6 sm:left-4 z-40 max-w-[220px] sm:max-w-[280px] animate-slide-in-left"
      role="status"
      aria-live="polite"
    >
      <div className="bg-white rounded-lg shadow-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-50 border-b border-neutral-100">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500" />
            </span>
            <span className="text-[10px] sm:text-xs text-neutral-500 font-medium">
              Actividad en vivo
            </span>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-neutral-400 hover:text-neutral-600 transition-colors p-0.5"
            aria-label="Cerrar notificación"
          >
            <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </button>
        </div>

        <div className="p-2 sm:p-3">
          <div className="flex items-start gap-2">
            <div
              className={`flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full ${config.bgColor} flex items-center justify-center shadow-md`}
            >
              <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${config.iconColor}`} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] sm:text-xs text-neutral-900 leading-tight">
                <span className="font-semibold">{notification.name}</span>
                <span className="text-neutral-500"> {notification.city}</span>
              </p>
              <p className="text-[11px] sm:text-xs text-neutral-700 mt-0.5 line-clamp-2">
                {config.getMessage(notification)}
              </p>
              <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
                {notification.timeAgo}
              </p>
            </div>
          </div>
        </div>

        {notificationCount > 3 && (
          <div className="px-2 py-1.5 sm:px-3 sm:py-2 bg-neutral-50 border-t border-neutral-100">
            <button
              onClick={() => { setIsEnabled(false); setIsVisible(false) }}
              className="text-[10px] sm:text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              No mostrar más
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
