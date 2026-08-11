import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { getBusinessSettings, updateBusinessSettings } from '@/lib/services/business-settings.service'

export async function GET() {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const admin = createAdminClient()
        const { data, error } = await getBusinessSettings(admin)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to fetch settings' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Business settings GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAdmin()
        if (errorResponse) return errorResponse

        const body = await request.json()
        const admin = createAdminClient()
        const { data, error } = await updateBusinessSettings(admin, {
            ...body,
            updated_by: user.id,
        })

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to update settings' }, { status: 400 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Business settings PATCH error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
