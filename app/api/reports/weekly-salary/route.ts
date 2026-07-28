import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getWeeklySalarySummary } from '@/lib/services/reports.service'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const start_date = searchParams.get('start_date')
        const end_date = searchParams.get('end_date')

        if (!start_date || !end_date) {
            return NextResponse.json(
                { error: 'start_date and end_date are required' },
                { status: 400 },
            )
        }

        const admin = createAdminClient()
        const { data, error } = await getWeeklySalarySummary(admin, {
            start_date,
            end_date,
        })

        if (error || !data) {
            console.error('Weekly salary summary failed:', error)
            return NextResponse.json({ error: error?.message ?? 'Failed to fetch summary' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Weekly salary unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
