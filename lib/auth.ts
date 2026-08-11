import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

type AdminResult = {
    user: import('@supabase/supabase-js').User
    profile: { role: string; name: string } | null
    errorResponse: null
}
type AdminError = { user: null; profile: null; errorResponse: NextResponse }

/**
 * Verify the user is authenticated AND has role 'admin'.
 * Use for sensitive routes (user management, salary, master data config, etc.).
 */
export async function requireAdmin(): Promise<AdminResult | AdminError> {
    const auth = await requireAuth()
    if (auth.errorResponse) {
        return { user: null, profile: null, errorResponse: auth.errorResponse }
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
        .from('profiles')
        .select('role, name')
        .eq('id', auth.user.id)
        .single()

    if (!profile || profile.role !== 'admin') {
        return {
            user: null,
            profile: null,
            errorResponse: NextResponse.json(
                { error: 'Forbidden: admin only' },
                { status: 403 },
            ),
        }
    }

    return { user: auth.user, profile, errorResponse: null }
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

/** Ambil role user dari tabel profiles (via admin client). */
export async function getUserRole(userId: string): Promise<string | null> {
    const admin = createAdminClient()
    const { data } = await admin
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
    return data?.role ?? null
}
