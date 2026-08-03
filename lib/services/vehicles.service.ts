import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    Vehicle,
    VehicleInsert,
    VehicleUpdate,
} from '@/lib/types/database'

type VehicleFilters = {
    customer_id?: number
    search?: string
}

export async function getVehicles(
    supabase: SupabaseClient,
    filters: VehicleFilters = {},
): Promise<{ data: Vehicle[] | null; error: Error | null }> {
    try {
        const { customer_id, search } = filters

        let query = supabase
            .from('vehicles')
            .select('*')
            .order('created_at', { ascending: false })

        if (customer_id) {
            query = query.eq('customer_id', customer_id)
        }
        if (search) {
            query = query.or(`plate_number.ilike.%${search}%,model.ilike.%${search}%,brand.ilike.%${search}%`)
        }

        const { data, error } = await query

        if (error) return { data: null, error: new Error(error.message) }
        return { data: (data ?? []) as Vehicle[], error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function getVehicleById(
    supabase: SupabaseClient,
    id: number,
): Promise<{ data: Vehicle | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return { data: null, error: new Error('Vehicle not found') }
        return { data: data as Vehicle, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

function normalizeVehicleInsert(data: VehicleInsert): VehicleInsert {
    return {
        ...data,
        plate_number: data.plate_number.trim().toUpperCase(),
        brand: data.brand?.trim() ? data.brand.trim() : null,
        model: data.model?.trim() ? data.model.trim() : null,
        color: data.color?.trim() ? data.color.trim() : null,
        notes: data.notes?.trim() ? data.notes.trim() : null,
    }
}

export async function createVehicle(
    supabase: SupabaseClient,
    data: VehicleInsert,
): Promise<{ data: Vehicle | null; error: Error | null }> {
    try {
        if (!data.customer_id) return { data: null, error: new Error('Customer is required') }
        if (!data.plate_number?.trim()) return { data: null, error: new Error('Plate number is required') }

        const normalized = normalizeVehicleInsert(data)
        const { data: row, error } = await supabase
            .from('vehicles')
            .insert(normalized)
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed to create vehicle') }
        return { data: row as Vehicle, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updateVehicle(
    supabase: SupabaseClient,
    id: number,
    data: VehicleUpdate,
): Promise<{ data: Vehicle | null; error: Error | null }> {
    try {
        const normalized: VehicleUpdate = {
            ...data,
            plate_number: data.plate_number?.trim().toUpperCase(),
            brand: data.brand?.trim() ? data.brand.trim() : null,
            model: data.model?.trim() ? data.model.trim() : null,
            color: data.color?.trim() ? data.color.trim() : null,
            notes: data.notes?.trim() ? data.notes.trim() : null,
        }

        const { data: row, error } = await supabase
            .from('vehicles')
            .update({ ...normalized, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed to update vehicle') }
        return { data: row as Vehicle, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deleteVehicle(
    supabase: SupabaseClient,
    id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('vehicles').delete().eq('id', id)
        return { error: error ? new Error(error.message) : null }
    } catch (err) {
        return { error: err as Error }
    }
}
