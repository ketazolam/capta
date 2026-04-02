import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 })

  const appId = process.env.META_APP_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`
  const state = Buffer.from(JSON.stringify({ projectId, userId: user.id })).toString("base64url")

  const scope = "ads_read,business_management"
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&response_type=code`

  return NextResponse.redirect(authUrl)
}
