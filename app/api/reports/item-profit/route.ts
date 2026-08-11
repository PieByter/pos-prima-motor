import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getItemProfitReport } from '@/lib/services/reports.service'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const start_date = searchParams.get('start_date') ?? new Date(new Date().setDate(1)).toISOString().slice(0, 10)
        const end_date = searchParams.get('end_date') ?? new Date().toISOString().slice(0, 10)

        const admin = createAdminClient()
        const { data, error } = await getItemProfitReport(admin, { start_date, end_date })

        if (error || !data) {
            console.error('Item profit GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch item profit report' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Item profit GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
