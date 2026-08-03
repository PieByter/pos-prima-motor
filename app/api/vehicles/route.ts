import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
    getVehicles,
    getVehicleById,
    createVehicle,
    updateVehicle,
    deleteVehicle,
} from '@/lib/services/vehicles.service'
import type { VehicleInsert, VehicleUpdate } from '@/lib/types/database'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const idParam = searchParams.get('id')

        const admin = createAdminClient()

        // GET /api/vehicles?id=5 → single vehicle
        if (idParam) {
            const { data, error } = await getVehicleById(admin, Number(idParam))
            if (error || !data) {
                return NextResponse.json({ error: error?.message ?? 'Vehicle not found' }, { status: 404 })
            }
            return NextResponse.json(data)
        }

        // GET /api/vehicles?customer_id=3 → list by customer
        const { data, error } = await getVehicles(admin, {
            customer_id: searchParams.get('customer_id') ? Number(searchParams.get('customer_id')) : undefined,
            search: searchParams.get('search') ?? undefined,
        })

        if (error || !data) {
            console.error('Vehicles GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Vehicles GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const body = (await request.json()) as VehicleInsert
        if (!body.plate_number?.trim()) {
            return NextResponse.json({ error: 'Plate number is required' }, { status: 422 })
        }
        if (!body.customer_id) {
            return NextResponse.json({ error: 'Customer is required' }, { status: 422 })
        }

        const admin = createAdminClient()
        const { data, error } = await createVehicle(admin, body)

        if (error || !data) {
            return NextResponse.json(
                { error: error?.message ?? 'Failed to create vehicle' },
                { status: 400 },
            )
        }
        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Vehicles POST unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const id = Number(searchParams.get('id'))
        if (!id) return NextResponse.json({ error: 'Vehicle id is required' }, { status: 422 })

        const body = (await request.json()) as VehicleUpdate

        const admin = createAdminClient()
        const { data, error } = await updateVehicle(admin, id, body)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to update vehicle' }, { status: 400 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Vehicles PUT unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const id = Number(searchParams.get('id'))
        if (!id) return NextResponse.json({ error: 'Vehicle id is required' }, { status: 422 })

        const admin = createAdminClient()
        const { error } = await deleteVehicle(admin, id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ ok: true })
    } catch (err) {
        console.error('Vehicles DELETE unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
