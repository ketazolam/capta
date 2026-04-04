"use client"

interface LogoProps {
  className?: string
}

const GANAMOS_URL = "https://tisydoofuojzminqybsy.supabase.co/storage/v1/object/public/comprobantes/logos/ganamos.png"
const ZEUS_URL = "https://tisydoofuojzminqybsy.supabase.co/storage/v1/object/public/comprobantes/logos/zeus.png"

export default function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <img
        src={GANAMOS_URL}
        alt="Casino Ganamos"
        className="h-20 sm:h-24 w-auto object-contain drop-shadow-lg"
      />
      <div className="w-px h-14 sm:h-16 bg-white/30" />
      <img
        src={ZEUS_URL}
        alt="Casino Zeus"
        className="h-14 sm:h-16 w-auto object-contain drop-shadow-lg opacity-90"
      />
    </div>
  )
}
