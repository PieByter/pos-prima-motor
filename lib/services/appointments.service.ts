import type { SupabaseClient } from '@supabase/supabase-js'

export type AppointmentStatus = 'waiting' | 'in_progress' | 'done' | 'cancelled'

export type Appointment = {
    id: number
    customer_id: number | null
    vehicle_id: number | null
    mechanic_id: string | null
    appointment_date: string
    status: AppointmentStatus
    description: string | null
    notes: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export type AppointmentWithDetails = Appointment & {
    customer?: { id: number; name: string; phone: string | null } | null
    vehicle?: { id: number; plate_number: string; brand: string | null; model: string | null } | null
    mechanic?: { id: string; name: string } | null
}

/** Antrian service — default tanggal hari ini, bisa filter tanggal/status. */
export async function getAppointments(
    supabase: SupabaseClient,
    filters: { date?: string; status?: AppointmentStatus } = {},
): Promise<{ data: AppointmentWithDetails[] | null; error: Error | null }> {
    try {
        let query = supabase
            .from('appointments')
            .select('*, customers(id, name, phone), vehicles(id, plate_number, brand, model), profiles!appointments_mechanic_id_profiles_id_fk(id, name)')
            .order('created_at', { ascending: false })

        if (filters.date) query = query.eq('appointment_date', filters.date)
        if (filters.status) query = query.eq('status', filters.status)

        const { data, error } = await query
        if (error) return { data: null, error: new Error(error.message) }

        const mapped = (data ?? []).map((r) => ({
            ...r,
            customer: r.customers ?? null,
            vehicle: r.vehicles ?? null,
            mechanic: r.profiles ?? null,
            customers: undefined,
            vehicles: undefined,
            profiles: undefined,
        }))

        return { data: mapped as AppointmentWithDetails[], error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createAppointment(
    supabase: SupabaseClient,
    data: {
        customer_id?: number | null
        vehicle_id?: number | null
        appointment_date: string
        description?: string | null
        notes?: string | null
        created_by: string
    },
): Promise<{ data: Appointment | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('appointments')
            .insert({
                customer_id: data.customer_id ?? null,
                vehicle_id: data.vehicle_id ?? null,
                appointment_date: data.appointment_date,
                description: data.description?.trim() ? data.description.trim() : null,
                notes: data.notes?.trim() ? data.notes.trim() : null,
                created_by: data.created_by,
            })
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: row as Appointment, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updateAppointmentStatus(
    supabase: SupabaseClient,
    id: number,
    status: AppointmentStatus,
    mechanicId?: string,
): Promise<{ data: Appointment | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('appointments')
            .update({
                status,
                mechanic_id: mechanicId ?? undefined,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: row as Appointment, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}
