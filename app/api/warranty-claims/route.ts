import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getWarrantyClaims, createWarrantyClaim, updateWarrantyClaim } from '@/lib/services/warranty-claims.service'
import type { WarrantyClaimInsert } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const status = (searchParams.get('status')?.trim() as 'pending' | 'approved' | 'rejected' | 'completed') || undefined
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Number(searchParams.get('limit') ?? 10)

        const admin = createAdminClient()
        const { data, error } = await getWarrantyClaims(admin, { status, page, limit })

        if (error || !data) {
            console.error('Warranty claims GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch warranty claims' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Warranty claims GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const body = (await request.json()) as WarrantyClaimInsert & { created_by?: string }

        if (!body.sale_detail_id || !body.item_id || !body.description?.trim()) {
            return NextResponse.json({ error: 'sale_detail_id, item_id, dan description wajib diisi' }, { status: 422 })
        }

        const admin = createAdminClient()
        const { data, error } = await createWarrantyClaim(admin, {
            ...body,
            created_by: user.id,
        })

        if (error || !data) {
            console.error('Warranty claims POST failed:', error)
            return NextResponse.json({ error: error?.message ?? 'Failed to create claim' }, { status: 400 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Warranty claims POST unexpected error:', err)
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
        const { data, error } = await updateWarrantyClaim(admin, id, body)

        if (error || !data) {
            console.error('Warranty claims PATCH failed:', error)
            return NextResponse.json({ error: error?.message ?? 'Failed to update claim' }, { status: 400 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Warranty claims PATCH unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
