"use client"

import { usePalaceConfig } from "./_context"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
  xl: "text-5xl",
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const { siteName } = usePalaceConfig()
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`font-serif font-black tracking-widest text-white uppercase ${sizeClasses[size]}`}>
        {siteName}
      </span>
    </div>
  )
}
