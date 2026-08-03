import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
  getPurchasePayments,
  createPurchasePayment,
  deletePurchasePayment,
} from '@/lib/services/purchase-payments.service'

type RouteParams = { params: Promise<{ id: string }> }

/** GET /api/purchases/[id]/payments — riwayat pembayaran hutang supplier */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const purchaseId = Number(id)
    if (isNaN(purchaseId)) return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })

    const admin = createAdminClient()
    const { data, error } = await getPurchasePayments(admin, purchaseId)

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Purchase payments GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/purchases/[id]/payments — catat pembayaran hutang supplier */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse

    const { id } = await params
    const purchaseId = Number(id)
    if (isNaN(purchaseId)) return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })

    const body = await request.json()

    const admin = createAdminClient()
    const { data, error } = await createPurchasePayment(admin, purchaseId, body, user.id)

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create payment' }, { status: 400 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Purchase payments POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** DELETE /api/purchases/[id]/payments?paymentId=5 — batalkan pembayaran */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const purchaseId = Number(id)
    if (isNaN(purchaseId)) return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })

    const paymentId = Number(request.nextUrl.searchParams.get('paymentId'))
    if (!paymentId) return NextResponse.json({ error: 'paymentId is required' }, { status: 422 })

    const admin = createAdminClient()
    const { error } = await deletePurchasePayment(admin, paymentId)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Purchase payments DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
