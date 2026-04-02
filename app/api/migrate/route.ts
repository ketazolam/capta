import { NextResponse } from "next/server"

// This endpoint applies pending migrations via Supabase Management API
// Call with: POST /api/migrate  + header x-internal-secret
// Requires SUPABASE_DB_PASSWORD env var set to the project database password
export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret")
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // SQL to apply
  const migrations = [
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_pixel_id text",
    "ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_access_token text",
  ]

  // Use pg to connect directly if DB_URL is available
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json({
      error: "DATABASE_URL not set. Please run the following SQL in your Supabase SQL Editor:",
      sql: migrations.join(";\n") + ";",
    }, { status: 400 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Client } = require("pg")
    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } })
    await client.connect()
    const results: string[] = []
    for (const sql of migrations) {
      try {
        await client.query(sql)
        results.push(`OK: ${sql}`)
      } catch (e: unknown) {
        results.push(`ERR: ${sql} → ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    await client.end()
    return NextResponse.json({ ok: true, results })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
