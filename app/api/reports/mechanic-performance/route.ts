import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getMechanicPerformance } from '@/lib/services/reports.service'

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
        const { data, error } = await getMechanicPerformance(admin, {
            start_date,
            end_date,
        })

        if (error || !data) {
            console.error('Mechanic performance report failed:', error)
            return NextResponse.json({ error: error?.message ?? 'Failed to fetch report' }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (err) {
        console.error('Mechanic performance unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
