import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getPayablesReport } from '@/lib/services/reports.service'

export async function GET() {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const admin = createAdminClient()
        const { data, error } = await getPayablesReport(admin)

        if (error || !data) {
            console.error('Payables report GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch payables report' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Payables report GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
