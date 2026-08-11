import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { updateCategory, deleteCategory } from '@/lib/services/categories.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin()
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const numId = Number(id)
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await updateCategory(admin, numId, body)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAdmin()
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const numId = Number(id)
    if (isNaN(numId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await deleteCategory(admin, numId)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ message: 'Category deleted' })
}
