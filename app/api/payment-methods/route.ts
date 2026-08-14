import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { getPaymentMethods, createPaymentMethod } from '@/lib/services/payment-methods.service'

export async function GET() {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const admin = createAdminClient()
        const { data, error } = await getPaymentMethods(admin)

        if (error || !data) {
            return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('PaymentMethods GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAdmin()
        if (errorResponse) return errorResponse
        void user

        const body = await request.json()
        const admin = createAdminClient()
        const { data, error } = await createPaymentMethod(admin, body)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to create payment method' }, { status: 400 })
        }
        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('PaymentMethods POST error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
