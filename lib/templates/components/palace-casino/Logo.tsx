import Image from "next/image"

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  siteName?: string
}

const sizes = {
  sm: { width: 120, height: 40 },
  md: { width: 180, height: 60 },
  lg: { width: 240, height: 80 },
  xl: { width: 320, height: 107 },
}

export default function Logo({ size = "md", className = "", siteName = "Palace" }: LogoProps) {
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
