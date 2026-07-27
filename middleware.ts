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
        /*
         * Match all request paths EXCEPT:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - public images / fonts (svg, png, jpg, jpeg, gif, webp)
         * - robots.txt / sitemap.xml etc.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
