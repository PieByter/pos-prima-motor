import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getWarrantyList } from '@/lib/services/warranty.service'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const status = request.nextUrl.searchParams.get('status') as 'active' | 'expiring' | 'expired' | null

        const admin = createAdminClient()
        const { data, error } = await getWarrantyList(admin, status ?? undefined)

        if (error || !data) {
            console.error('Warranty GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch warranty list' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Warranty GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
