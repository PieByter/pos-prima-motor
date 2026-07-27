import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth()
        if (auth.errorResponse) return auth.errorResponse

        const sp = request.nextUrl.searchParams
        const field = sp.get('field')
        const limit = Number(sp.get('limit') ?? 50)

        const admin = createAdminClient()
        let q = admin
            .from('price_history')
            .select('*, items(name, sku)')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (field && field !== 'all') {
            q = q.eq('field', field)
        }

        const { data, error } = await q
        if (error) throw error

        return NextResponse.json({ data: data ?? [] })
    } catch (err) {
        console.error('Price history error:', err)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
