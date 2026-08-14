import type { SupabaseClient } from '@supabase/supabase-js'

export type VehicleDocument = {
    id: number
    vehicle_id: number
    doc_type: 'stnk' | 'pajak'
    due_date: string
    notes: string | null
    created_by: number | null
    created_at: string
    updated_at: string
}

export type VehicleDocumentWithVehicle = VehicleDocument & {
    vehicle?: {
        id: number
        plate_number: string
        brand: string | null
        model: string | null
        year: number | null
        customer_id: number
        customers?: { name: string; phone: string | null } | null
    } | null
}

/** Daftar dokumen + info kendaraan & pemilik. */
export async function getVehicleDocuments(
    supabase: SupabaseClient,
): Promise<{ data: VehicleDocumentWithVehicle[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('vehicle_documents')
            .select('*, vehicles(*, customers(name, phone))')
            .order('due_date', { ascending: true })

        if (error) return { data: null, error: new Error(error.message) }

        const mapped = (data ?? []).map((d) => ({
            ...d,
            vehicle: d.vehicles
                ? {
                    ...d.vehicles,
                    customers: (d.vehicles as unknown as { customers?: unknown }).customers ?? null,
                }
                : null,
            vehicles: undefined,
        }))

        return { data: mapped as VehicleDocumentWithVehicle[], error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createVehicleDocument(
    supabase: SupabaseClient,
    data: { vehicle_id: number; doc_type: 'stnk' | 'pajak'; due_date: string; notes?: string | null },
): Promise<{ data: VehicleDocument | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('vehicle_documents')
            .insert({
                ...data,
                notes: data.notes?.trim() ? data.notes.trim() : null,
            })
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: row as VehicleDocument, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deleteVehicleDocument(
    supabase: SupabaseClient,
    id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('vehicle_documents').delete().eq('id', id)
        return { error: error ? new Error(error.message) : null }
    } catch (err) {
        return { error: err as Error }
    }
}
