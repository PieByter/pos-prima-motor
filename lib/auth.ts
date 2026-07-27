import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

type AuthResult = { user: import('@supabase/supabase-js').User; errorResponse: null }
type AuthError = { user: null; errorResponse: NextResponse }

/**
 * Verify the user is authenticated.
 * Call this at the top of every protected API route.
 * Returns the user on success, or a 401 Response on failure.
 */
export async function requireAuth(): Promise<AuthResult | AuthError> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return {
            user: null,
            errorResponse: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
        }
    }

    return { user, errorResponse: null }
}

/**
 * Quick check: only verifies auth without returning user.
 * Use in API routes that don't need the user object.
 */
export async function requireAuthOnly(): Promise<NextResponse | null> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return null
}
