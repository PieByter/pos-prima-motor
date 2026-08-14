import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getAppointments, createAppointment, updateAppointmentStatus } from '@/lib/services/appointments.service'
import type { AppointmentStatus } from '@/lib/services/appointments.service'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const searchParams = request.nextUrl.searchParams
        const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)
        const statusRaw = searchParams.get('status')
        const status = (statusRaw === 'waiting' || statusRaw === 'in_progress' || statusRaw === 'done' || statusRaw === 'cancelled')
            ? (statusRaw as AppointmentStatus)
            : undefined

        const admin = createAdminClient()
        const { data, error } = await getAppointments(admin, { date, status })

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to fetch' }, { status: 500 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Appointments GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const body = await request.json()
        if (!body.appointment_date) {
            return NextResponse.json({ error: 'appointment_date wajib diisi' }, { status: 422 })
        }

        const admin = createAdminClient()
        const { data, error } = await createAppointment(admin, { ...body, created_by: user.id })

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to create' }, { status: 400 })
        }
        return NextResponse.json(data, { status: 201 })
    } catch (err) {
        console.error('Appointments POST error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const searchParams = request.nextUrl.searchParams
        const id = Number(searchParams.get('id') ?? 0)
        if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 422 })

        const body = await request.json()
        const admin = createAdminClient()
        const { data, error } = await updateAppointmentStatus(admin, id, body.status, body.mechanic_id ?? user.id)

        if (error || !data) {
            return NextResponse.json({ error: error?.message ?? 'Failed to update' }, { status: 400 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Appointments PATCH error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
