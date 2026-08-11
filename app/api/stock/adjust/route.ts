import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const { item_id, type, quantity } = await request.json()

        if (!item_id || !type || !quantity || quantity < 1) {
            return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Record stock movement
        const { error: movError } = await admin.from('stock_movements').insert({
            item_id,
            type,
            quantity,
            reference_type: 'adjustment',
            reference_id: 0,
        })

        if (movError) {
            return NextResponse.json({ error: movError.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Stock adjust error:', err)
        return NextResponse.json({ error: 'Internal error' }, { status: 500 })
    }
}
