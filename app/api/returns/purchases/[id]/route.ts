import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getPurchaseReturnById, updatePurchaseReturnStatus } from '@/lib/services/returns.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const { id } = await params
    const admin = createAdminClient()
    const { data, error } = await getPurchaseReturnById(admin, Number(id))
    if (error || !data) return NextResponse.json({ error: 'Return not found' }, { status: 404 })
    return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const auth = await requireAuth()
        if (auth.errorResponse) return auth.errorResponse

        const { id } = await params
        const body = await request.json()

        const admin = createAdminClient()
        const { data, error } = await updatePurchaseReturnStatus(admin, Number(id), {
            status: body.status,
            processed_by: body.status === 'processed' || body.status === 'rejected' ? auth.user.id : undefined,
        })

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to update return' }, { status: 400 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Purchase return PATCH error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
