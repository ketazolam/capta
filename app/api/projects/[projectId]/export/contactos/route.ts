import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function escapeCsv(val: string): string {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("phone, name, total_purchases, purchase_count, first_seen_at, last_seen_at")
    .eq("project_id", projectId)
    .order("total_purchases", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const header = "Teléfono,Nombre,Total compras,Cantidad compras,Primera vez,Última vez"
  const rows = (contacts ?? []).map((c) => {
    const phone = escapeCsv(c.phone || "")
    const name = escapeCsv(c.name || "")
    const total = c.total_purchases ? String(c.total_purchases) : "0"
    const count = c.purchase_count ? String(c.purchase_count) : "0"
    const primera = c.first_seen_at ? new Date(c.first_seen_at).toLocaleDateString("es-AR") : ""
    const ultima = c.last_seen_at ? new Date(c.last_seen_at).toLocaleDateString("es-AR") : ""
    return `${phone},${name},${total},${count},${primera},${ultima}`
  })

  const csv = [header, ...rows].join("\n")
  const today = new Date().toISOString().slice(0, 10)

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="contactos_${today}.csv"`,
    },
  })
}
