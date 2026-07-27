import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { deleteExpense } from '@/lib/services/expenses.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const { id } = await params
        const numericId = Number(id)
        if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

        const admin = createAdminClient()
        const { error } = await deleteExpense(admin, numericId)

        if (error) {
            return NextResponse.json({ error: error.message ?? 'Failed to delete expense' }, { status: 400 })
        }
        return NextResponse.json({ message: 'Expense deleted' })
    } catch (err) {
        console.error('Expense DELETE error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
