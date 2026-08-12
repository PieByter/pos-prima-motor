import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { createStockAdjustment } from '@/lib/services/stock-adjustments.service'
import type { StockAdjustmentInsert } from '@/lib/types/database'

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const { item_id, type, quantity, reason } = await request.json() as {
            item_id: number
            type: 'IN' | 'OUT'
            quantity: number
            reason?: string
        }

        if (!item_id || !type || !quantity || quantity < 1) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Catat ke stock_adjustments (reason 'count_fix' utk opname) —
        // service ini juga menulis stock_movements otomatis (konsisten dgn halaman Adjust Stok)
        const payload: StockAdjustmentInsert = {
            item_id,
            type,
            quantity,
            adjustment_date: new Date().toISOString().slice(0, 10),
            reason: reason?.includes('opname') ? 'count_fix' : 'other',
            notes: typeof reason === 'string' ? reason : null,
            created_by: user.id,
        }
        const { data, error } = await createStockAdjustment(admin, payload)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to adjust stock' }, { status: 500 })
        }

        return NextResponse.json({ success: true, adjustment_id: data.id })
    } catch (err) {
        console.error('Stock adjust error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
