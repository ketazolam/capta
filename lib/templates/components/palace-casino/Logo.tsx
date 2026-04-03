"use client"

import Image from "next/image"
import { usePalaceConfig } from "./_context"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizes = {
  sm: { width: 120, height: 40 },
  md: { width: 180, height: 60 },
  lg: { width: 240, height: 80 },
  xl: { width: 320, height: 107 },
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const { siteName } = usePalaceConfig()
  const { width, height } = sizes[size]
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/palace-casino/logo.png"
        alt={siteName}
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </div>
  )
}
