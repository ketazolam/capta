import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  // Auth check — RLS will filter if no session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = new URL(req.url)
  const range = url.searchParams.get("range") || "all"
  const status = url.searchParams.get("status") || "all"

  let query = supabase
    .from("sales")
    .select("created_at, phone, amount, reference, status, reject_reason")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  const validStatuses = ["pending", "confirmed", "rejected"]
  if (status !== "all") {
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    query = query.eq("status", status)
  }

  if (range !== "all") {
    const days = range === "today" ? 0 : range === "7d" ? 7 : range === "30d" ? 30 : null
    if (days !== null) {
      const since = new Date()
      if (days === 0) {
        since.setUTCHours(0, 0, 0, 0)
      } else {
        since.setTime(since.getTime() - days * 86400000)
      }
      query = query.gte("created_at", since.toISOString())
    }
  }

  const { data: sales, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const header = "Fecha,Teléfono,Monto,Referencia,Estado,Motivo rechazo"
  const rows = (sales ?? []).map((s) => {
    const fecha = new Date(s.created_at).toLocaleDateString("es-AR")
    const phone = escapeCsv(s.phone || "")
    const amount = s.amount ? String(s.amount) : ""
    const reference = escapeCsv(s.reference || "")
    const estado = s.status || ""
    const motivo = escapeCsv((s.reject_reason as string) || "")
    return `${fecha},${phone},${amount},${reference},${estado},${motivo}`
  })

  const csv = [header, ...rows].join("\n")
  const today = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ventas_${today}.csv"`,
    },
  })
}
