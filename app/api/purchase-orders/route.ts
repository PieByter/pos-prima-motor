import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
    getPurchaseOrders,
    getPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrderStatus,
    deletePurchaseOrder,
} from '@/lib/services/purchase-orders.service'
import type { PurchaseOrderInsert } from '@/lib/types/database'

type POInsert = PurchaseOrderInsert & {
    details?: { item_id: number; quantity: number; price: number }[]
}

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const statusRaw = searchParams.get('status')?.trim()
        const status = (statusRaw === 'draft' || statusRaw === 'sent' || statusRaw === 'partial' || statusRaw === 'received' || statusRaw === 'cancelled')
            ? statusRaw
            : undefined
        const supplierId = Number(searchParams.get('supplier_id') ?? 0) || undefined
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Number(searchParams.get('limit') ?? 10)
        const id = Number(searchParams.get('id') ?? 0)

        const admin = createAdminClient()

        if (id) {
            const { data, error } = await getPurchaseOrderById(admin, id)
            if (error || !data) return NextResponse.json({ error: 'PO not found' }, { status: 404 })
            return NextResponse.json(data)
        }

        const { data, error } = await getPurchaseOrders(admin, { status, supplierId, page, limit })

        if (error || !data) {
            console.error('Purchase orders GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Purchase orders GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const body = (await request.json()) as POInsert

        if (!body.supplier_id || !body.order_date) {
            return NextResponse.json({ error: 'supplier_id dan order_date wajib diisi' }, { status: 422 })
        }
        if (!body.details || body.details.length === 0) {
            return NextResponse.json({ error: 'Minimal 1 item PO' }, { status: 422 })
        }

        const admin = createAdminClient()
        const { data, error } = await createPurchaseOrder(admin, {
            supplier_id: body.supplier_id,
            po_number: body.po_number,
            order_date: body.order_date,
            expected_date: body.expected_date ?? null,
            status: body.status ?? 'draft',
            total_amount: 0, // dihitung ulang di service
            notes: body.notes ?? null,
            created_by: user.id,
        }, body.details)

        if (error || !data) {
            console.error('Purchase orders POST failed:', error)
            return NextResponse.json({ error: error?.message ?? 'Failed to create PO' }, { status: 400 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Purchase orders POST unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const id = Number(searchParams.get('id') ?? 0)
        if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 422 })

        const body = await request.json()
        const admin = createAdminClient()

        if (body.status) {
            const { data, error } = await updatePurchaseOrderStatus(admin, id, body.status)
            if (error || !data) {
                return NextResponse.json({ error: error?.message ?? 'Failed to update PO status' }, { status: 400 })
            }
            return NextResponse.json(data)
        }

        return NextResponse.json({ error: 'Hanya status yang bisa diubah' }, { status: 422 })
    } catch (err) {
        console.error('Purchase orders PATCH unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const id = Number(searchParams.get('id') ?? 0)
        if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 422 })

        const admin = createAdminClient()
        const { error } = await deletePurchaseOrder(admin, id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Purchase orders DELETE unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
