import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin } from '@/lib/auth'
import { getVehicleDocuments, createVehicleDocument } from '@/lib/services/vehicle-documents.service'

export async function GET() {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const admin = createAdminClient()
        const { data, error } = await getVehicleDocuments(admin)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to fetch' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Vehicle documents GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAdmin()
        if (errorResponse) return errorResponse
        void user

        const body = await request.json()
        if (!body.vehicle_id || !body.due_date) {
            return NextResponse.json({ error: 'vehicle_id dan due_date wajib diisi' }, { status: 422 })
        }

        const admin = createAdminClient()
        const { data, error } = await createVehicleDocument(admin, body)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to create' }, { status: 400 })
        }
        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Vehicle documents POST error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
