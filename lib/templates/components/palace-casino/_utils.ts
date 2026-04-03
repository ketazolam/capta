// Utility functions for Palace Casino template

// ── Safe Storage ──────────────────────────────────────────────────────────────
type StorageKind = "local" | "session"

function getStorage(kind: StorageKind): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function storageGet(kind: StorageKind, key: string): string | null {
  return getStorage(kind)?.getItem(key) ?? null
}

export function storageSet(kind: StorageKind, key: string, value: string): void {
  try { getStorage(kind)?.setItem(key, value) } catch { /* no-op */ }
}

export function storageRemove(kind: StorageKind, key: string): void {
  try { getStorage(kind)?.removeItem(key) } catch { /* no-op */ }
}

// ── Argentina Data (for social proof widgets) ─────────────────────────────────
const NOMBRES_MASCULINOS = [
  "Martín","Juan","Carlos","Diego","Pablo","Lucas","Matías","Nicolás",
  "Sebastián","Federico","Alejandro","Gonzalo","Facundo","Leandro","Maximiliano",
  "Agustín","Tomás","Franco","Damián","Ezequiel","Hernán","Rodrigo","Gabriel",
]
const NOMBRES_FEMENINOS = [
  "María","Laura","Carolina","Florencia","Valentina","Camila","Luciana","Romina",
  "Soledad","Daniela","Natalia","Paula","Mariana","Victoria","Gabriela",
  "Julieta","Agustina","Micaela","Sofía","Celeste","Yanina","Silvina","Andrea",
]
const APELLIDOS = [
  "González","Rodríguez","García","Fernández","López","Martínez","Sánchez",
  "Pérez","Romero","Díaz","Torres","Ruiz","Álvarez","Ramírez","Flores",
  "Acosta","Medina","Herrera","Castro","Vargas","Silva","Morales","Gutiérrez",
]
const CIUDADES = [
  { nombre: "CABA", peso: 25 },
  { nombre: "Buenos Aires", peso: 20 },
  { nombre: "Córdoba", peso: 12 },
  { nombre: "Rosario", peso: 10 },
  { nombre: "Mendoza", peso: 8 },
  { nombre: "Tucumán", peso: 6 },
  { nombre: "La Plata", peso: 5 },
  { nombre: "Mar del Plata", peso: 4 },
  { nombre: "Salta", peso: 3 },
  { nombre: "Neuquén", peso: 3 },
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getRandomName(): { nombre: string; inicial: string } {
  const useFem = Math.random() > 0.5
  const first = pick(useFem ? NOMBRES_FEMENINOS : NOMBRES_MASCULINOS)
  const last = pick(APELLIDOS)
  return { nombre: `${first} ${last.charAt(0)}.`, inicial: first.charAt(0) }
}

export function getWeightedCity(): string {
  const total = CIUDADES.reduce((s, c) => s + c.peso, 0)
  let r = Math.random() * total
  for (const c of CIUDADES) {
    r -= c.peso
    if (r <= 0) return c.nombre
  }
  return CIUDADES[0].nombre
}

/** @deprecated use getWeightedCity */
export const getRandomCity = getWeightedCity

export function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getTimeAgo(): string {
  const minutes = Math.floor(Math.random() * 55) + 1
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours} h`
}

export const juegosPopulares: { nombre: string; popular: boolean }[] = [
  { nombre: "Sweet Bonanza", popular: true },
  { nombre: "Gates of Olympus", popular: true },
  { nombre: "Aviator", popular: true },
  { nombre: "Fortune Tiger", popular: true },
  { nombre: "Ruleta en Vivo", popular: true },
  { nombre: "Spaceman", popular: false },
  { nombre: "Big Bass Splash", popular: false },
  { nombre: "Wolf Gold", popular: false },
  { nombre: "Fire Joker", popular: false },
  { nombre: "Fruit Party", popular: false },
]

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getRandomAmount(min: number, max: number): number {
  const step = 500
  const steps = Math.floor((max - min) / step)
  return min + Math.floor(Math.random() * steps) * step
}
