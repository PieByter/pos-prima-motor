import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
    getPaymentMethodById,
    updatePaymentMethod,
    deletePaymentMethod,
} from '@/lib/services/payment-methods.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await getPaymentMethodById(admin, numericId)

    if (error || !data) return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    return NextResponse.json(data)
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const { id } = await params
        const numericId = Number(id)
        if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const body = await request.json()
        const admin = createAdminClient()
        const { data, error } = await updatePaymentMethod(admin, numericId, body)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to update payment method' }, { status: 400 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('PaymentMethods PUT error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const { id } = await params
        const numericId = Number(id)
        if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const admin = createAdminClient()
        const { error } = await deletePaymentMethod(admin, numericId)

        if (error) {
            return NextResponse.json({ error: error.message ?? 'Failed to delete payment method' }, { status: 400 })
        }
        return NextResponse.json({ message: 'Payment method deleted' })
    } catch (err) {
        console.error('PaymentMethods DELETE error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
