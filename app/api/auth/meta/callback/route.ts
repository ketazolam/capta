import { createServiceClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  if (error || !code || !state) {
    return NextResponse.redirect(`${appUrl}/dashboard?meta_error=cancelled`)
  }

  let projectId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString())
    projectId = decoded.projectId
  } catch {
    return NextResponse.redirect(`${appUrl}/dashboard?meta_error=invalid_state`)
  }

  const appId = process.env.META_APP_ID!
  const appSecret = process.env.META_APP_SECRET!
  const redirectUri = `${appUrl}/api/auth/meta/callback`

  // 1. Exchange code for short-lived token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
  )
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return NextResponse.redirect(`${appUrl}/project/${projectId}/settings/general?meta_error=token_failed`)
  }

  // 2. Exchange for long-lived token (60 days)
  const llRes = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
  )
  const llData = await llRes.json()
  const longLivedToken = llData.access_token || tokenData.access_token

  // 3. Get ad accounts + pixels
  const accountsRes = await fetch(
    `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,adspixels{id,name}&access_token=${longLivedToken}&limit=50`
  )
  const accountsData = await accountsRes.json()

  // Flatten all pixels across all ad accounts
  const pixels: { id: string; name: string; accountId: string; accountName: string }[] = []
  for (const account of accountsData.data || []) {
    for (const pixel of account.adspixels?.data || []) {
      pixels.push({
        id: pixel.id,
        name: pixel.name || `Pixel ${pixel.id}`,
        accountId: account.id,
        accountName: account.name,
      })
    }
  }

  const supabase = await createServiceClient()

  if (pixels.length === 1) {
    // Auto-select if only one pixel
    await supabase.from("projects").update({
      meta_pixel_id: pixels[0].id,
      meta_access_token: longLivedToken,
    }).eq("id", projectId)

    return NextResponse.redirect(`${appUrl}/project/${projectId}/settings/general?meta_connected=1&pixel=${pixels[0].id}`)
  }

  if (pixels.length === 0) {
    return NextResponse.redirect(`${appUrl}/project/${projectId}/settings/general?meta_error=no_pixels`)
  }

  // Multiple pixels — store token temporarily and redirect to selection
  // Store token + pixels in a temp record
  await supabase.from("projects").update({
    meta_access_token: longLivedToken,
  }).eq("id", projectId)

  const pixelsParam = encodeURIComponent(JSON.stringify(pixels))
  return NextResponse.redirect(
    `${appUrl}/project/${projectId}/settings/general?meta_select=1&pixels=${pixelsParam}`
  )
}
