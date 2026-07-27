import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Supabase middleware helper — refreshes the session cookie on every request
 * and protects dashboard / auth routes.
 *
 * Usage: import and call from `middleware.ts` at the project root.
 */
export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options),
                    )
                },
            },
        },
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // ── Route classification ──────────────────────────────────────────────
    const pathname = request.nextUrl.pathname

    const isAuthRoute =
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/forgot-password') ||
        pathname.startsWith('/reset-password')

    const isDashboardRoute = pathname.startsWith('/dashboard')
    const isAuthApiRoute = pathname.startsWith('/api/auth')

    // ── Authenticated user on auth pages → redirect to dashboard ───────────
    if (user && isAuthRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // ── Unauthenticated user on dashboard → redirect to login ─────────────
    if (!user && isDashboardRoute) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // ── Allow everything else (API routes including auth API, static files) ─
    return supabaseResponse
}
