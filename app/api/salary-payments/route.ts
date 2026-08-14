import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { getSalaryPayments, createSalaryPayment } from '@/lib/services/salary-payments.service'
import type { SalaryPaymentInsert } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const mechanicId = searchParams.get('mechanic_id')?.trim() || undefined
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Number(searchParams.get('limit') ?? 10)

        const admin = createAdminClient()
        const { data, error } = await getSalaryPayments(admin, { mechanicId, page, limit })

        if (error || !data) {
            console.error('Salary payments GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch salary payments' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Salary payments GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAdmin()
        if (errorResponse) return errorResponse

        const body = (await request.json()) as SalaryPaymentInsert & { created_by?: string }

        if (!body.mechanic_id || !body.payment_date || !body.amount || Number(body.amount) <= 0) {
            return NextResponse.json({ error: 'mechanic_id, payment_date, dan amount wajib diisi' }, { status: 422 })
        }

        const admin = createAdminClient()
        const { data, error } = await createSalaryPayment(admin, {
            ...body,
            created_by: user.id,
        })

        if (error || !data) {
            console.error('Salary payments POST failed:', error)
            return NextResponse.json({ error: error?.message ?? 'Failed to create salary payment' }, { status: 400 })
        }

        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Salary payments POST unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
