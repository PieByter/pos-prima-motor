import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getCustomerLoyalty, earnPoints, redeemPoints } from '@/lib/services/loyalty.service'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const customerId = Number(request.nextUrl.searchParams.get('customer_id'))
        if (!customerId) {
            return NextResponse.json({ error: 'customer_id is required' }, { status: 400 })
        }

        const admin = createAdminClient()
        const { data, error } = await getCustomerLoyalty(admin, customerId)
        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to fetch loyalty' }, { status: 400 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Loyalty GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const body = await request.json().catch(() => ({}))
        const { customer_id, action, points, reference } = body

        if (!customer_id || !points || !['earn', 'redeem'].includes(action)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const admin = createAdminClient()
        const p = Math.floor(Number(points))
        const result =
            action === 'earn'
                ? await earnPoints(admin, Number(customer_id), p, reference ?? null, user.id)
                : await redeemPoints(admin, Number(customer_id), p, reference ?? null, user.id)

        if (result.error || !result.data) {
            return NextResponse.json({ error: result.error?.message ?? 'Failed to update points' }, { status: 400 })
        }
        return NextResponse.json(result.data, { status: 201 })
    } catch (err) {
        console.error('Loyalty POST unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
