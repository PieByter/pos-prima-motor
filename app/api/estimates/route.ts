import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
    getEstimates,
    getEstimateById,
    createEstimate,
    updateEstimateStatus,
    deleteEstimate,
} from '@/lib/services/estimates.service'
import type { EstimateItemInsert } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const id = Number(searchParams.get('id') ?? 0)

        const admin = createAdminClient()

        if (id) {
            const { data, error } = await getEstimateById(admin, id)
            if (error || !data) return NextResponse.json({ error: 'Estimate not found' }, { status: 404 })
            return NextResponse.json(data)
        }

        const { data, error } = await getEstimates(admin, {
            search: searchParams.get('search') ?? undefined,
            status: searchParams.get('status') ?? undefined,
            page: Number(searchParams.get('page') ?? 1),
            limit: Number(searchParams.get('limit') ?? 10),
        })
        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to fetch estimates' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Estimates GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const body = await request.json().catch(() => ({}))
        const { customer_id, vehicle_id, description, notes, items } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Minimal 1 item estimasi' }, { status: 422 })
        }

        const admin = createAdminClient()
        const detailRows: EstimateItemInsert[] = (items as EstimateItemInsert[]).map((it) => ({
            item_id: it.item_id ? Number(it.item_id) : null,
            name: String(it.name ?? ''),
            type: it.type === 'service' ? 'service' : 'part',
            quantity: Math.max(1, Number(it.quantity) || 1),
            price: Number(it.price) || 0,
        }))

        const { data, error } = await createEstimate(
            admin,
            {
                customer_id: customer_id ? Number(customer_id) : null,
                vehicle_id: vehicle_id ? Number(vehicle_id) : null,
                description: description?.trim() ? description.trim() : null,
                notes: notes?.trim() ? notes.trim() : null,
                status: 'draft',
                created_by: user.id,
            },
            detailRows,
        )
        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to create estimate' }, { status: 400 })
        }
        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Estimates POST unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const id = Number(request.nextUrl.searchParams.get('id') ?? 0)
        if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 422 })

        const body = await request.json().catch(() => ({}))
        if (!body.status) return NextResponse.json({ error: 'status wajib diisi' }, { status: 422 })

        const valid = ['draft', 'sent', 'approved', 'converted', 'cancelled']
        if (!valid.includes(body.status)) return NextResponse.json({ error: 'status tidak valid' }, { status: 422 })

        const admin = createAdminClient()
        const { data, error } = await updateEstimateStatus(admin, id, body.status)
        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to update estimate' }, { status: 400 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Estimates PATCH unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const id = Number(request.nextUrl.searchParams.get('id') ?? 0)
        if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 422 })

        const admin = createAdminClient()
        const { error } = await deleteEstimate(admin, id)
        if (error) {
            return NextResponse.json({ error: error.message ?? 'Failed to delete estimate' }, { status: 400 })
        }
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('Estimates DELETE unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
