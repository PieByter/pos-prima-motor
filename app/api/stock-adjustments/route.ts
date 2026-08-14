import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getStockAdjustments, createStockAdjustment } from '@/lib/services/stock-adjustments.service'
import type { StockAdjustmentInsert } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const itemId = Number(searchParams.get('item_id') ?? 0) || undefined
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Number(searchParams.get('limit') ?? 10)

        const admin = createAdminClient()
        const { data, error } = await getStockAdjustments(admin, { itemId, page, limit })

        if (error || !data) {
            console.error('Stock adjustments GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch stock adjustments' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Stock adjustments GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const body = (await request.json()) as StockAdjustmentInsert & { created_by?: string }

        if (!body.item_id || !body.type || !body.quantity || Number(body.quantity) < 1) {
            return NextResponse.json({ error: 'item_id, type, dan quantity wajib diisi' }, { status: 422 })
        }
        if (body.type !== 'IN' && body.type !== 'OUT') {
            return NextResponse.json({ error: 'type harus IN atau OUT' }, { status: 422 })
        }

        const admin = createAdminClient()
        const { data, error } = await createStockAdjustment(admin, {
            ...body,
            created_by: user.id,
        })

        if (error || !data) {
            console.error('Stock adjustments POST failed:', error)
            return NextResponse.json({ error: error?.message ?? 'Failed to create adjustment' }, { status: 400 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Stock adjustments POST unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
