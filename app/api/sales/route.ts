import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// POST /api/sales — crear una venta pendiente manualmente
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { project_id, phone, amount, reference, image_url, raw_text, page_id, line_id } = body

    if (!project_id) {
      return NextResponse.json({ error: "project_id required" }, { status: 400 })
    }

    const supabase = await createServiceClient()

    // Upsert contact
    if (phone) {
      await supabase.from("contacts").upsert(
        { project_id, phone, last_seen_at: new Date().toISOString() },
        { onConflict: "project_id,phone", ignoreDuplicates: false }
      )
    }

    const { data: sale, error } = await supabase
      .from("sales")
      .insert({
        project_id,
        page_id: page_id || null,
        line_id: line_id || null,
        phone: phone || null,
        amount: amount || null,
        reference: reference || null,
        image_url: image_url || null,
        raw_text: raw_text || null,
        status: "pending",
      })
      .select("id")
      .single()

    if (error) {
      console.error("[Sales POST] insert error:", error)
      return NextResponse.json({ error: "Failed to create sale" }, { status: 500 })
    }

    return NextResponse.json({ ok: true, saleId: sale.id })
  } catch (err) {
    console.error("[Sales POST]", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
