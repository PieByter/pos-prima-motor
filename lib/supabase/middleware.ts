import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({ request })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        },
    )

    const { pathname } = request.nextUrl

    // ── Route protection ──────────────────────────────────────────────────
    const {
        data: { session },
    } = await supabase.auth.getSession()

    // Protected dashboard routes → redirect to login
    if (!session && pathname.startsWith('/dashboard')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Protected API routes (non-auth) → return 401
    if (!session && pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Auth pages when already logged in → redirect to dashboard
    if (
        session &&
        (pathname === '/login' ||
            pathname === '/register' ||
            pathname === '/forgot-password' ||
            pathname === '/reset-password')
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
