import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getCategories, createCategory } from '@/lib/services/categories.service'

export async function GET() {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const admin = createAdminClient()
    const { data, error } = await getCategories(admin)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await createCategory(admin, body)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
}
