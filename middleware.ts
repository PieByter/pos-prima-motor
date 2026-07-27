import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * Next.js middleware — runs on every matched request.
 * Handles Supabase session refresh and route protection.
 */
export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

// ── Matcher ─────────────────────────────────────────────────────────────────
// Only run on pages that need auth/auth-redirect or could have auth cookies.
// Static assets and public files are excluded.
export const config = {
    matcher: [
        // Only run on pages that need auth or could have auth cookies
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)',
    ],
}
