import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { updateBrand, deleteBrand } from '@/lib/services/brands.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const numId = Number(id)
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await updateBrand(admin, numId, body)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const numId = Number(id)
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await deleteBrand(admin, numId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ message: 'Brand deleted' })
}
