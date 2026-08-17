import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    Estimate,
    EstimateInsert,
    EstimateItem,
    EstimateItemInsert,
    EstimateWithDetails,
    PaginatedResponse,
    SaleInsert,
} from '@/lib/types/database'
import { createSale, generateInvoiceNumber } from './sales.service'

type EstimateFilters = {
    search?: string
    status?: string
    page?: number
    limit?: number
}

type SupabaseRow = Record<string, unknown>

function mapEstimate(row: SupabaseRow): Estimate {
    return {
        ...row,
        total_amount: Number(row.total_amount),
    } as unknown as Estimate
}

function mapEstimateItem(row: SupabaseRow): EstimateItem {
    return {
        ...row,
        quantity: Number(row.quantity),
        price: Number(row.price),
        subtotal: Number(row.subtotal),
    } as unknown as EstimateItem
}

/** Daftar estimasi + relasi customer & kendaraan. */
export async function getEstimates(
    supabase: SupabaseClient,
    filters: EstimateFilters = {},
): Promise<{ data: PaginatedResponse<Estimate> | null; error: Error | null }> {
    try {
        const { search, status, page = 1, limit = 10 } = filters
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('estimates')
            .select('*, customers(id, name, phone), vehicles(id, plate_number, brand, model)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (status) query = query.eq('status', status)
        if (search) query = query.or(`estimate_number.ilike.%${search}%,description.ilike.%${search}%`)

        const { data, error, count } = await query
        if (error) return { data: null, error: new Error(error.message) }

        const enriched = (data ?? []).map((r: SupabaseRow) => ({
            ...mapEstimate(r),
            customer: r.customers ?? null,
            vehicle: r.vehicles ?? null,
            customers: undefined,
            vehicles: undefined,
        }))

        return {
            data: { data: enriched, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit), page, limit },
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/** Detail estimasi + item + customer + kendaraan. */
export async function getEstimateById(
    supabase: SupabaseClient,
    id: number,
): Promise<{ data: EstimateWithDetails | null; error: Error | null }> {
    try {
        const { data: est, error } = await supabase
            .from('estimates')
            .select('*, customers(id, name, phone), vehicles(id, plate_number, brand, model)')
            .eq('id', id)
            .maybeSingle()

        if (error) return { data: null, error: new Error(error.message) }
        if (!est) return { data: null, error: new Error('Estimate not found') }

        const { data: items } = await supabase
            .from('estimate_items')
            .select('*')
            .eq('estimate_id', id)
            .order('id', { ascending: true })

        return {
            data: {
                ...mapEstimate(est),
                customer: est.customers ?? null,
                vehicle: est.vehicles ?? null,
                items: (items ?? []).map(mapEstimateItem),
            },
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/** Buat estimasi baru (header + baris item), total dihitung otomatis. */
export async function createEstimate(
    supabase: SupabaseClient,
    data: Omit<EstimateInsert, 'estimate_number' | 'total_amount'>,
    items: EstimateItemInsert[],
): Promise<{ data: Estimate | null; error: Error | null }> {
    try {
        if (items.length === 0) return { data: null, error: new Error('Minimal 1 item estimasi') }

        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const { count } = await supabase
            .from('estimates')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${today.slice(0, 4)}-${today.slice(4, 6)}-${today.slice(6, 8)}`)

        const estimate_number = `EST-${today}-${String((count ?? 0) + 1).padStart(3, '0')}`

        const total = items.reduce((sum, it) => sum + Number(it.price) * Number(it.quantity), 0)

        const { data: row, error } = await supabase
            .from('estimates')
            .insert({ ...data, estimate_number, total_amount: String(total) })
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed to create estimate') }

        const detailRows = items.map((it) => ({
            estimate_id: row.id,
            item_id: it.item_id ?? null,
            name: it.name,
            type: it.type,
            quantity: Number(it.quantity),
            price: String(it.price),
            subtotal: String(Number(it.price) * Number(it.quantity)),
        }))

        const { error: detError } = await supabase.from('estimate_items').insert(detailRows)
        if (detError) {
            await supabase.from('estimates').delete().eq('id', row.id)
            return { data: null, error: new Error(detError.message) }
        }

        return { data: mapEstimate(row), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/** Ubah status estimasi (draft → sent → approved → cancelled, dst). */
export async function updateEstimateStatus(
    supabase: SupabaseClient,
    id: number,
    status: Estimate['status'],
): Promise<{ data: Estimate | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('estimates')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed to update estimate') }
        return { data: mapEstimate(data), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deleteEstimate(
    supabase: SupabaseClient,
    id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('estimates').delete().eq('id', id)
        if (error) return { error: new Error(error.message) }
        return { error: null }
    } catch (err) {
        return { error: err as Error }
    }
}

/**
 * Konversi estimasi yang sudah APPROVED menjadi transaksi penjualan.
 * Baris part → sale_details; baris jasa → ditambahkan sebagai service_fee
 * pada baris part pertama (agar total penjualan = total estimasi).
 * Estimasi ditandai status 'converted'.
 */
export async function convertEstimateToSale(
    supabase: SupabaseClient,
    id: number,
    mechanicId: string,
    createdBy: string,
): Promise<{ data: EstimateWithDetails | null; sale: { id: number; invoice_number: string } | null; error: Error | null }> {
    try {
        const { data: estimate, error } = await getEstimateById(supabase, id)
        if (error || !estimate) return { data: null, sale: null, error: error ?? new Error('Estimate not found') }
        if (estimate.status !== 'approved') {
            return { data: null, sale: null, error: new Error('Hanya estimasi APPROVED yang bisa dikonversi') }
        }

        const partDetails = estimate.items.filter((i) => i.type === 'part' && i.item_id != null)
        if (partDetails.length === 0) {
            return { data: null, sale: null, error: new Error('Estimasi tidak punya item part untuk dikonversi') }
        }

        const serviceLines = estimate.items.filter((i) => i.type === 'service')
        const serviceTotal = serviceLines.reduce((s, i) => s + i.subtotal, 0)

        const details = partDetails.map((p, idx) => ({
            item_id: p.item_id!,
            quantity: p.quantity,
            base_price: p.price,
            discount_amount: 0,
            final_price: p.price,
            service_fee: idx === 0 ? serviceTotal : 0,
            subtotal: p.subtotal + (idx === 0 ? serviceTotal : 0),
            warranty_months: null,
        }))

        const total = details.reduce((s, d) => s + d.subtotal, 0)
        const today = new Date().toISOString().slice(0, 10)
        const invoiceNumber = await generateInvoiceNumber(supabase)

        const header: SaleInsert = {
            customer_id: estimate.customer_id,
            vehicle_id: estimate.vehicle_id,
            mechanic_id: mechanicId,
            invoice_number: invoiceNumber,
            sale_date: today,
            total_amount: total,
            status: 'completed',
            sale_type: serviceLines.length > 0 ? 'hybrid' : 'purchase',
            payment_status: 'unpaid',
            paid_amount: 0,
            remaining_amount: total,
            payment_method_id: null,
            cash_amount: null,
            change_amount: null,
            notes: [
                `Dari estimasi ${estimate.estimate_number}`,
                serviceLines.length > 0 ? `Jasa: ${serviceLines.map((s) => s.name).join(', ')}` : '',
            ].filter(Boolean).join('\n'),
            created_by: createdBy,
        }

        const { data: sale, error: saleError } = await createSale(supabase, header, details)
        if (saleError || !sale) return { data: null, sale: null, error: saleError ?? new Error('Failed to create sale') }

        await supabase
            .from('estimates')
            .update({ status: 'converted', updated_at: new Date().toISOString() })
            .eq('id', id)

        return {
            data: { ...estimate, status: 'converted' },
            sale: { id: sale.id, invoice_number: sale.invoice_number },
            error: null,
        }
    } catch (err) {
        return { data: null, sale: null, error: err as Error }
    }
}
