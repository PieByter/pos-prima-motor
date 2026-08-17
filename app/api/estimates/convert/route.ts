import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { convertEstimateToSale } from '@/lib/services/estimates.service'

/** Konversi estimasi APPROVED menjadi transaksi penjualan. */
export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const body = await request.json().catch(() => ({}))
        const id = Number(body.id ?? 0)
        const mechanicId = body.mechanic_id ?? user.id

        if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 422 })

        const admin = createAdminClient()
        const { data, sale, error } = await convertEstimateToSale(admin, id, String(mechanicId), user.id)
        if (error || !data || !sale) {
            return NextResponse.json({ error: error?.message ?? 'Failed to convert estimate' }, { status: 400 })
        }
        return NextResponse.json({ estimate: data, sale })
    } catch (err) {
        console.error('Estimates convert unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
