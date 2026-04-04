import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const APP_HOST = (process.env.NEXT_PUBLIC_APP_URL || 'https://capta-eight.vercel.app')
  .replace('https://', '')
  .replace('http://', '')

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || ''

  // Custom domain: not the main app host, not localhost, not Vercel preview URL
  const isCustomDomain =
    hostname !== APP_HOST &&
    !hostname.includes('localhost') &&
    !hostname.endsWith('.vercel.app')

  // Never intercept API or Next.js internal routes on custom domains
  const pathname = request.nextUrl.pathname

  // Edge case: when the main app domain is ALSO registered as a landing page custom_domain
  // (e.g. ganamosmedia.com is both APP_HOST and has a page with custom_domain='ganamosmedia.com')
  // Only intercept root path — all other paths (/project, /auth, /api, /s/) flow normally
  const isMainDomainRoot =
    hostname === APP_HOST &&
    pathname === '/' &&
    !hostname.includes('localhost') &&
    !hostname.endsWith('.vercel.app')

  if ((isCustomDomain || isMainDomainRoot) && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    // Use service role key to bypass RLS — safe here, this runs server-side only (middleware)
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const res = await fetch(
      `${supabaseUrl}/rest/v1/pages?custom_domain=eq.${encodeURIComponent(hostname)}&select=slug&is_published=eq.true&limit=1`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        // Cache for 60s at the edge to avoid a DB hit on every request
        next: { revalidate: 60 },
      }
    )

    const rows: { slug: string }[] = await res.json()

    if (rows?.[0]?.slug) {
      const url = request.nextUrl.clone()
      url.pathname = `/s/${rows[0].slug}`
      return NextResponse.rewrite(url)
    }

    return new NextResponse('Not found', { status: 404 })
  }

  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
