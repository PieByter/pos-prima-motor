import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getExpenses, createExpense } from '@/lib/services/expenses.service'

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const sp = request.nextUrl.searchParams
    const admin = createAdminClient()
    const { data, error } = await getExpenses(admin, {
        category: sp.get('category') ?? undefined,
        start_date: sp.get('start_date') ?? undefined,
        end_date: sp.get('end_date') ?? undefined,
        page: Number(sp.get('page') ?? 1),
        limit: Number(sp.get('limit') ?? 20),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const body = await request.json()
    body.created_by = auth.user.id
    const admin = createAdminClient()
    const { data, error } = await createExpense(admin, body)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
}
