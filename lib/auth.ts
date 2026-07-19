import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Verify the user is authenticated.
 * Call this at the top of every protected API route.
 * Returns the user on success, or a 401 Response on failure.
 */
export async function requireAuth() {
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
