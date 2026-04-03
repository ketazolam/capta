import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function signState(payload: string, secret: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  )
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload))
  return Buffer.from(sig).toString("base64url")
}

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get("projectId")
  if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 })

  const secret = process.env.META_APP_SECRET!
  const payload = Buffer.from(JSON.stringify({ projectId, userId: user.id, ts: Date.now() })).toString("base64url")
  const sig = await signState(payload, secret)
  const state = `${payload}.${sig}`

  const appId = process.env.META_APP_ID!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`
  const scope = "ads_management"
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}&response_type=code`

  return NextResponse.redirect(authUrl)
}
