import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getSalePayments, createSalePayment, deleteSalePayment } from '@/lib/services/payments.service'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/sales/[id]/payments — riwayat pembayaran sebuah transaksi */
export async function GET(_request: NextRequest, { params }: RouteParams) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const { id } = await params
        const saleId = Number(id)
        if (isNaN(saleId)) return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 })

        const admin = createAdminClient()
        const { data, error } = await getSalePayments(admin, saleId)

        if (error || !data) {
            return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Payments GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** POST /api/sales/[id]/payments — catat pembayaran utang */
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const { id } = await params
        const saleId = Number(id)
        if (isNaN(saleId)) return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 })

        const body = await request.json()

        const admin = createAdminClient()
        const { data, error } = await createSalePayment(admin, saleId, body, user.id)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to create payment' }, { status: 400 })
        }
        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Payments POST unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/** DELETE /api/sales/[id]/payments?paymentId=5 — batalkan pembayaran */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const { id } = await params
        const saleId = Number(id)
        if (isNaN(saleId)) return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 })

        const paymentId = Number(request.nextUrl.searchParams.get('paymentId'))
        if (!paymentId) return NextResponse.json({ error: 'paymentId is required' }, { status: 422 })

        const admin = createAdminClient()
        const { error } = await deleteSalePayment(admin, paymentId)

        if (error) return NextResponse.json({ error: error.message }, { status: 400 })
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('Payments DELETE unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
