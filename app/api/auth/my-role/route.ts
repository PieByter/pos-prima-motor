import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

export async function GET() {
    try {
        const auth = await requireAuth()
        if (auth.errorResponse) return auth.errorResponse

        const admin = createAdminClient()
        const { data: profile } = await admin
            .from('profiles')
            .select('role, name')
            .eq('id', auth.user.id)
            .single()

        return NextResponse.json({
            role: profile?.role ?? 'mekanik',
            name: profile?.name ?? 'User',
            id: auth.user.id,
        })
    } catch {
        return NextResponse.json({ role: 'mekanik', name: 'User', id: null })
    }
}
