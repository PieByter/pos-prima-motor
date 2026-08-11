import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    PurchaseOrder,
    PurchaseOrderInsert,
    PurchaseOrderDetailInsert,
    PurchaseOrderWithDetails,
    PaginatedResponse,
} from '@/lib/types/database'

type PurchaseOrderFilters = {
    status?: 'draft' | 'sent' | 'partial' | 'received' | 'cancelled'
    supplierId?: number
    page?: number
    limit?: number
}

export async function getPurchaseOrders(
    supabase: SupabaseClient,
    filters: PurchaseOrderFilters = {},
): Promise<{ data: PaginatedResponse<PurchaseOrderWithDetails> | null; error: Error | null }> {
    try {
        const { status, supplierId, page = 1, limit = 10 } = filters
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('purchase_orders')
            .select('*, suppliers(id, name), purchase_order_details(*, items(id, name, sku))', { count: 'exact' })
            .order('order_date', { ascending: false })
            .range(from, to)

        if (status) query = query.eq('status', status)
        if (supplierId) query = query.eq('supplier_id', supplierId)

        const { data, error, count } = await query

        if (error) return { data: null, error: new Error(error.message) }

        const mapped = (data ?? []).map((r) => ({
            ...r,
            supplier: r.suppliers ?? null,
            details: (r.purchase_order_details ?? []).map((d: Record<string, unknown>) => ({
                ...d,
                item: d.items ?? null,
                items: undefined,
            })),
            suppliers: undefined,
            purchase_order_details: undefined,
        }))

        return {
            data: {
                data: mapped as PurchaseOrderWithDetails[],
                total: count ?? 0,
                page,
                limit,
                totalPages: Math.ceil((count ?? 0) / limit),
            },
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function getPurchaseOrderById(
    supabase: SupabaseClient,
    id: number,
): Promise<{ data: PurchaseOrderWithDetails | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('purchase_orders')
            .select('*, suppliers(id, name), purchase_order_details(*, items(id, name, sku))')
            .eq('id', id)
            .single()

        if (error || !data) return { data: null, error: new Error('Purchase order not found') }

        return {
            data: {
                ...data,
                supplier: data.suppliers ?? null,
                details: (data.purchase_order_details ?? []).map((d: Record<string, unknown>) => ({
                    ...d,
                    item: d.items ?? null,
                    items: undefined,
                })),
                suppliers: undefined,
                purchase_order_details: undefined,
            } as PurchaseOrderWithDetails,
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createPurchaseOrder(
    supabase: SupabaseClient,
    data: PurchaseOrderInsert,
    details: PurchaseOrderDetailInsert[],
): Promise<{ data: PurchaseOrder | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('purchase_orders')
            .insert({
                ...data,
                total_amount: String(details.reduce((sum, d) => sum + Number(d.price) * Number(d.quantity), 0)),
                notes: data.notes?.trim() ? data.notes.trim() : null,
            })
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed to create PO') }

        const detailRows = details.map((d) => ({
            po_id: row.id,
            item_id: d.item_id,
            quantity: Number(d.quantity),
            price: String(d.price),
            subtotal: String(Number(d.price) * Number(d.quantity)),
        }))

        const { error: detError } = await supabase.from('purchase_order_details').insert(detailRows)
        if (detError) return { data: null, error: new Error(detError.message) }

        return { data: row as PurchaseOrder, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/**
 * Update status PO + set detail item sebagai "diterima" (jika status received).
 */
export async function updatePurchaseOrderStatus(
    supabase: SupabaseClient,
    id: number,
    status: PurchaseOrder['status'],
): Promise<{ data: PurchaseOrder | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('purchase_orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error('PO not found') }

        // Jika semua barang diterima → mark received_quantity = quantity
        if (status === 'received') {
            const { data: details } = await supabase
                .from('purchase_order_details')
                .select('id, quantity')
                .eq('po_id', id)

            for (const d of details ?? []) {
                await supabase
                    .from('purchase_order_details')
                    .update({ received_quantity: d.quantity })
                    .eq('id', d.id)
            }
        }

        return { data: row as PurchaseOrder, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deletePurchaseOrder(
    supabase: SupabaseClient,
    id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('purchase_orders').delete().eq('id', id)
        return { error: error ? new Error(error.message) : null }
    } catch (err) {
        return { error: err as Error }
    }
}
