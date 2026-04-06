import { NextResponse } from "next/server"

// Returns the SQL that needs to be applied to the database
// Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/tisydoofuojzminqybsy/sql
export async function POST(req: Request) {
  const secret = req.headers.get("x-internal-secret")
  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sql = `
-- Migration 002: Add Meta pixel columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_pixel_id text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meta_access_token text;

-- Add global unique constraint on page slugs for smart links
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pages_slug_global_unique'
  ) THEN
    ALTER TABLE pages ADD CONSTRAINT pages_slug_global_unique UNIQUE (slug);
  END IF;
END $$;
  `.trim()

  return NextResponse.json({
    message: "Run this SQL in your Supabase SQL Editor",
    sql,
  })
}

export async function GET() {
  return NextResponse.json({ status: "ok", info: "POST with x-internal-secret header to get migration SQL" })
}
