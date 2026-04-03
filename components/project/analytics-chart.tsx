"use client"

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface DailyData {
  date: string
  page_view: number
  button_click: number
  purchase: number
}

interface Props {
  data: DailyData[]
}

const SERIES = [
  { key: "page_view", label: "Visitas", color: "#3b82f6" },
  { key: "button_click", label: "Clics", color: "#8b5cf6" },
  { key: "purchase", label: "Ventas", color: "#10b981" },
] as const

export default function AnalyticsChart({ data }: Props) {
  if (!data.length) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <p className="text-zinc-400 text-sm font-medium mb-4">Evolución diaria</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            {SERIES.map(({ key, color }) => (
              <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#71717a", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(val: string) => {
              const d = new Date(val + "T00:00:00")
              return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" })
            }}
          />
          <YAxis tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 8, color: "#fff" }}
            labelFormatter={(label) => typeof label === "string" ? new Date(label + "T00:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }) : String(label)}
          />
          {SERIES.map(({ key, label, color }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${key})`}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
