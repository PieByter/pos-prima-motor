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

export type VehicleServiceHistoryEntry = {
    id: number
    invoice_number: string
    sale_date: string
    sale_type: string
    status: string
    payment_status: string
    total_amount: number
    service_fee_total: number
    items: { name: string; quantity: number; service_fee: number }[]
}

/** Riwayat service/penjualan untuk satu motor — lengkap dengan detail item */
export async function getVehicleServiceHistory(
    supabase: SupabaseClient,
    vehicleId: number,
    limit = 50,
): Promise<{ data: VehicleServiceHistoryEntry[] | null; error: Error | null }> {
    try {
        const { data: salesData, error: salesError } = await supabase
            .from('sales')
            .select('id, invoice_number, sale_date, sale_type, status, payment_status, total_amount')
            .eq('vehicle_id', vehicleId)
            .order('sale_date', { ascending: false })
            .limit(limit)

        if (salesError) return { data: null, error: new Error(salesError.message) }

        const sales = (salesData ?? []) as Array<{
            id: number
            invoice_number: string
            sale_date: string
            sale_type: string
            status: string
            payment_status: string
            total_amount: number
        }>

        // Ambil detail item untuk semua sale sekaligus
        const saleIds = sales.map((s) => s.id)
        let detailsBySale = new Map<number, { name: string; quantity: number; service_fee: number }[]>()

        if (saleIds.length > 0) {
            const { data: detailData, error: detailError } = await supabase
                .from('sale_details')
                .select('sale_id, quantity, service_fee, items(name)')
                .in('sale_id', saleIds)

            if (detailError) return { data: null, error: new Error(detailError.message) }

            const map = new Map<number, { name: string; quantity: number; service_fee: number }[]>()
            for (const d of detailData ?? []) {
                const item = {
                    name: (d.items as { name?: string } | null)?.name ?? 'Item',
                    quantity: Number(d.quantity),
                    service_fee: Number(d.service_fee ?? 0),
                }
                const list = map.get(d.sale_id) ?? []
                list.push(item)
                map.set(d.sale_id, list)
            }
            detailsBySale = map
        }

        const entries: VehicleServiceHistoryEntry[] = sales.map((s) => {
            const items = detailsBySale.get(s.id) ?? []
            return {
                id: s.id,
                invoice_number: s.invoice_number,
                sale_date: s.sale_date,
                sale_type: s.sale_type,
                status: s.status,
                payment_status: s.payment_status,
                total_amount: Number(s.total_amount),
                service_fee_total: items.reduce((sum, i) => sum + i.service_fee, 0),
                items,
            }
        })

        return { data: entries, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
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
