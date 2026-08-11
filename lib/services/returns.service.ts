import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    SalesReturn, SalesReturnInsert, SalesReturnUpdate,
    SalesReturnDetailInsert,
    SalesReturnWithDetails,
    PurchaseReturn, PurchaseReturnInsert, PurchaseReturnUpdate,
    PurchaseReturnDetailInsert,
    PurchaseReturnWithDetails,
} from '@/lib/types/database'

type SupabaseRow = Record<string, unknown>

function mapReturn(row: SupabaseRow): SalesReturn {
    return { ...row, total_refund: Number(row.total_refund) } as unknown as SalesReturn
}

export async function getSalesReturns(
    supabase: SupabaseClient,
): Promise<{ data: SalesReturn[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('sales_returns')
            .select('*, sales(invoice_number)')
            .order('created_at', { ascending: false })
        if (error) return { data: null, error: new Error(error.message) }
        return { data: (data ?? []).map(mapReturn), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function getSalesReturnById(
    supabase: SupabaseClient, id: number,
): Promise<{ data: SalesReturnWithDetails | null; error: Error | null }> {
    try {
        const { data: ret, error } = await supabase
            .from('sales_returns')
            .select('*, sales(invoice_number)')
            .eq('id', id)
            .single()
        if (error || !ret) return { data: null, error: new Error('Return not found') }

        const { data: details } = await supabase
            .from('sales_return_details')
            .select('*, items(*)')
            .eq('return_id', id)

        return {
            data: {
                ...mapReturn(ret),
                details: (details ?? []).map((d) => ({
                    ...d,
                    refund_amount: Number(d.refund_amount),
                    item: d.items ? {
                        ...(d.items as SupabaseRow),
                        purchase_price: Number((d.items as SupabaseRow).purchase_price),
                        selling_price: Number((d.items as SupabaseRow).selling_price),
                        service_fee: Number((d.items as SupabaseRow).service_fee),
                    } : undefined,
                    items: undefined,
                })),
            } as unknown as SalesReturnWithDetails,
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createSalesReturn(
    supabase: SupabaseClient,
    header: SalesReturnInsert,
    details: Omit<SalesReturnDetailInsert, 'return_id'>[],
): Promise<{ data: SalesReturn | null; error: Error | null }> {
    try {
        const { data: ret, error: retError } = await supabase
            .from('sales_returns')
            .insert(header)
            .select()
            .single()
        if (retError || !ret) return { data: null, error: new Error(retError?.message ?? 'Failed') }

        const detailsWithId = details.map((d) => ({ ...d, return_id: ret.id }))
        const { error: detError } = await supabase.from('sales_return_details').insert(detailsWithId)
        if (detError) {
            await supabase.from('sales_returns').delete().eq('id', ret.id)
            return { data: null, error: new Error(detError.message) }
        }

        // Restore stock
        const stockMovs = details.map((d) => ({
            item_id: d.item_id,
            type: 'IN' as const,
            quantity: d.quantity,
            reference_type: 'sale' as const,
            reference_id: ret.id,
        }))
        await supabase.from('stock_movements').insert(stockMovs)

        return { data: mapReturn(ret), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updateSalesReturnStatus(
    supabase: SupabaseClient, id: number, payload: SalesReturnUpdate,
): Promise<{ data: SalesReturn | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('sales_returns')
            .update(payload)
            .eq('id', id)
            .select()
            .single()
        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: mapReturn(data), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

function mapPurchaseReturn(row: SupabaseRow): PurchaseReturn {
    return { ...row, total_refund: Number(row.total_refund) } as unknown as PurchaseReturn
}

export async function getPurchaseReturns(
    supabase: SupabaseClient,
): Promise<{ data: PurchaseReturn[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('purchase_returns')
            .select('*, purchases(invoice_number)')
            .order('created_at', { ascending: false })
        if (error) return { data: null, error: new Error(error.message) }
        return { data: (data ?? []).map(mapPurchaseReturn), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function getPurchaseReturnById(
    supabase: SupabaseClient, id: number,
): Promise<{ data: PurchaseReturnWithDetails | null; error: Error | null }> {
    try {
        const { data: ret, error } = await supabase
            .from('purchase_returns')
            .select('*, purchases(invoice_number)')
            .eq('id', id)
            .single()
        if (error || !ret) return { data: null, error: new Error('Return not found') }

        const { data: details } = await supabase
            .from('purchase_return_details')
            .select('*, items(*)')
            .eq('return_id', id)

        return {
            data: {
                ...mapPurchaseReturn(ret),
                details: (details ?? []).map((d) => ({
                    ...d,
                    refund_amount: Number(d.refund_amount),
                    item: d.items ? {
                        ...(d.items as SupabaseRow),
                        purchase_price: Number((d.items as SupabaseRow).purchase_price),
                        selling_price: Number((d.items as SupabaseRow).selling_price),
                        service_fee: Number((d.items as SupabaseRow).service_fee),
                    } : undefined,
                    items: undefined,
                })),
            } as unknown as PurchaseReturnWithDetails,
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createPurchaseReturn(
    supabase: SupabaseClient,
    header: PurchaseReturnInsert,
    details: Omit<PurchaseReturnDetailInsert, 'return_id'>[],
): Promise<{ data: PurchaseReturn | null; error: Error | null }> {
    try {
        const { data: ret, error: retError } = await supabase
            .from('purchase_returns')
            .insert(header)
            .select()
            .single()
        if (retError || !ret) return { data: null, error: new Error(retError?.message ?? 'Failed') }

        const detailsWithId = details.map((d) => ({ ...d, return_id: ret.id }))
        const { error: detError } = await supabase.from('purchase_return_details').insert(detailsWithId)
        if (detError) {
            await supabase.from('purchase_returns').delete().eq('id', ret.id)
            return { data: null, error: new Error(detError.message) }
        }

        // Keluarkan stok (barang dikembalikan ke supplier)
        const stockMovs = details.map((d) => ({
            item_id: d.item_id,
            type: 'OUT' as const,
            quantity: d.quantity,
            reference_type: 'purchase' as const,
            reference_id: ret.id,
        }))
        await supabase.from('stock_movements').insert(stockMovs)

        return { data: mapPurchaseReturn(ret), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updatePurchaseReturnStatus(
    supabase: SupabaseClient, id: number, payload: PurchaseReturnUpdate,
): Promise<{ data: PurchaseReturn | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('purchase_returns')
            .update(payload)
            .eq('id', id)
            .select()
            .single()
        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: mapPurchaseReturn(data), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}
