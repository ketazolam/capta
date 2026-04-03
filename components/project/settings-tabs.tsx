import Link from "next/link"

const TABS = [
  { label: "General", href: "general" },
  { label: "Miembros", href: "members" },
  { label: "Notificaciones", href: "notifications" },
  { label: "Integraciones", href: "integrations" },
]

export default function SettingsTabs({
  projectId,
  active,
}: {
  projectId: string
  active: "general" | "members" | "notifications" | "integrations"
}) {
  return (
    <div className="flex gap-1 border-b border-zinc-800 pb-0">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={`/project/${projectId}/settings/${tab.href}`}
          className={`px-4 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
            active === tab.href
              ? "border-emerald-500 text-white font-medium"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
