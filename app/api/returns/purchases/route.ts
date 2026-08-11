import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    try {
        const body = await request.json()
        const admin = createAdminClient()

        const header = {
            purchase_id: body.purchase_id,
            return_date: new Date().toISOString().slice(0, 10),
            reason: body.reason,
            total_refund: body.total_refund,
            status: 'pending' as const,
        }

        const { data: ret, error: retError } = await admin
            .from('purchase_returns')
            .insert(header)
            .select()
            .single()

        if (retError || !ret) {
            return NextResponse.json({ error: retError?.message ?? 'Failed' }, { status: 400 })
        }

        const details = (body.items ?? []).map((item: { item_id: number; quantity: number; refund_amount: number }) => ({
            return_id: ret.id,
            item_id: item.item_id,
            quantity: item.quantity,
            refund_amount: item.refund_amount,
        }))

        if (details.length > 0) {
            const { error: detError } = await admin.from('purchase_return_details').insert(details)
            if (detError) {
                await admin.from('purchase_returns').delete().eq('id', ret.id)
                return NextResponse.json({ error: detError.message }, { status: 400 })
            }
        }

        return NextResponse.json(ret, { status: 201 })
    } catch (err) {
        console.error('Purchase return error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
