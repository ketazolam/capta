"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BarChart2,
  ShoppingBag,
  Users,
  FileText,
  Smartphone,
  Settings,
  ChevronDown,
  Zap,
  ArrowLeft,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navItems = [
  { label: "Analytics", href: "analytics", icon: BarChart2 },
  { label: "Ventas", href: "ventas", icon: ShoppingBag },
  { label: "Contactos", href: "contactos", icon: Users },
  { label: "Páginas", href: "paginas", icon: FileText },
  { label: "Líneas", href: "lineas", icon: Smartphone },
  { label: "Configuración", href: "settings/general", icon: Settings },
]

interface Props {
  projectId: string
  projectName: string
  credits: number
  allProjects: { id: string; name: string }[]
}

export default function ProjectSidebar({ projectId, projectName, credits, allProjects }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="w-56 flex flex-col border-r border-zinc-800 bg-[#0d0d0d] shrink-0">
      {/* Project selector */}
      <div className="p-3 border-b border-zinc-800">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-zinc-800 transition-colors text-left">
            <div className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <span className="text-emerald-400 font-bold text-xs">
                {projectName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm font-medium text-white truncate flex-1">{projectName}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            {allProjects.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => router.push(`/project/${p.id}/analytics`)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <div className="w-5 h-5 rounded bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <span className="text-emerald-400 font-bold text-xs">{p.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="flex-1 truncate">{p.name}</span>
                {p.id === projectId && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </DropdownMenuItem>
            ))}
            {allProjects.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => router.push("/dashboard")} className="text-zinc-400 cursor-pointer">
              Ver todos los proyectos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const href = `/project/${projectId}/${item.href}`
          const isActive = pathname.startsWith(`/project/${projectId}/${item.href.split("/")[0]}`)
          return (
            <Link
              key={item.href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-zinc-800 text-white font-medium"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom: credits + back */}
      <div className="p-3 border-t border-zinc-800 space-y-2">
        <div className="flex items-center gap-2 px-2 py-2 bg-zinc-900 rounded-lg">
          <Zap className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-sm font-medium text-white">{credits}</span>
          <span className="text-xs text-zinc-500">créditos</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-2 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors rounded-lg hover:bg-zinc-800/40"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Todos los proyectos
        </Link>
      </div>
    </aside>
  )
}
