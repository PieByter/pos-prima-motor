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
            .select('*, suppliers(id, name, phone), purchase_order_details(*, items(id, name, sku))', { count: 'exact' })
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
            .select('*, suppliers(id, name, phone), purchase_order_details(*, items(id, name, sku))')
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
 * Saat status received: otomatis buat transaksi pembelian + stok IN (via createPurchase).
 */
export async function updatePurchaseOrderStatus(
    supabase: SupabaseClient,
    id: number,
    status: PurchaseOrder['status'],
): Promise<{ data: PurchaseOrder | null; error: Error | null; purchase?: { id: number; invoice_number: string } | null }> {
    try {
        const { data: row, error } = await supabase
            .from('purchase_orders')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error('PO not found') }

        let createdPurchase: { id: number; invoice_number: string } | null = null

        // Barang diterima → buat transaksi pembelian + update received_quantity
        if (status === 'received') {
            const { data: po } = await supabase
                .from('purchase_orders')
                .select('*, purchase_order_details(item_id, quantity, price, subtotal)')
                .eq('id', id)
                .single()

            const details = (po?.purchase_order_details ?? []) as {
                item_id: number
                quantity: number
                price: string | number
                subtotal: string | number
            }[]

            if (details.length > 0 && po?.supplier_id) {
                // Generate nomor invoice pembelian
                const year = new Date().getFullYear()
                const { count } = await supabase
                    .from('purchases')
                    .select('*', { count: 'exact', head: true })
                    .ilike('invoice_number', `PO-${year}-%`)
                const invoiceNumber = `PO-${year}-${String((count ?? 0) + 1).padStart(3, '0')}`

                const total = details.reduce((sum, d) => sum + Number(d.subtotal ?? Number(d.price) * Number(d.quantity)), 0)

                // Header pembelian — lunas saat barang diterima
                const { data: purchaseRow, error: purchaseError } = await supabase
                    .from('purchases')
                    .insert({
                        supplier_id: po.supplier_id,
                        invoice_number: invoiceNumber,
                        purchase_date: new Date().toISOString().slice(0, 10),
                        total_amount: String(total),
                        status: 'completed',
                        payment_status: 'paid',
                        paid_amount: String(total),
                        remaining_amount: '0',
                        created_by: po.created_by,
                    })
                    .select()
                    .single()

                if (purchaseError) return { data: null, error: new Error(purchaseError.message) }

                // Detail pembelian
                const detailRows = details.map((d) => ({
                    purchase_id: purchaseRow.id,
                    item_id: d.item_id,
                    quantity: Number(d.quantity),
                    price: String(d.price),
                    subtotal: String(d.subtotal ?? Number(d.price) * Number(d.quantity)),
                }))
                const { error: detError } = await supabase.from('purchase_details').insert(detailRows)
                if (detError) {
                    await supabase.from('purchases').delete().eq('id', purchaseRow.id)
                    return { data: null, error: new Error(detError.message) }
                }

                // Stok masuk
                const stockMovs = details.map((d) => ({
                    item_id: d.item_id,
                    type: 'IN' as const,
                    quantity: Number(d.quantity),
                    reference_type: 'purchase' as const,
                    reference_id: purchaseRow.id,
                }))
                const { error: stockError } = await supabase.from('stock_movements').insert(stockMovs)
                if (stockError) {
                    await supabase.from('purchase_details').delete().eq('purchase_id', purchaseRow.id)
                    await supabase.from('purchases').delete().eq('id', purchaseRow.id)
                    return { data: null, error: new Error(stockError.message) }
                }

                createdPurchase = { id: purchaseRow.id, invoice_number: invoiceNumber }
            }

            // Mark received_quantity = quantity
            const { data: odDetails } = await supabase
                .from('purchase_order_details')
                .select('id, quantity')
                .eq('po_id', id)

            for (const d of odDetails ?? []) {
                await supabase
                    .from('purchase_order_details')
                    .update({ received_quantity: d.quantity })
                    .eq('id', d.id)
            }
        }

        return { data: row as PurchaseOrder, error: null, purchase: createdPurchase }
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
