import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getActivityLogs } from '@/lib/services/activity-log.service'

export async function GET(request: NextRequest) {
    try {
        const auth = await requireAuth()
        if (auth.errorResponse) return auth.errorResponse

        const sp = request.nextUrl.searchParams
        const admin = createAdminClient()
        const { data, error } = await getActivityLogs(admin, {
            page: Number(sp.get('page') ?? 1),
            limit: Number(sp.get('limit') ?? 50),
            entity: sp.get('entity') ?? undefined,
            action: sp.get('action') ?? undefined,
        })

        if (error || !data) {
            return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Activity log GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
