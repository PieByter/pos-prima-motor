import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getVehicleServiceHistory } from '@/lib/services/vehicles.service'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const vehicleId = Number(searchParams.get('vehicle_id'))
        if (!vehicleId) {
            return NextResponse.json({ error: 'vehicle_id is required' }, { status: 422 })
        }

        const admin = createAdminClient()
        const { data, error } = await getVehicleServiceHistory(admin, vehicleId)

        if (error || !data) {
            console.error('Vehicle history GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch vehicle history' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Vehicle history GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
