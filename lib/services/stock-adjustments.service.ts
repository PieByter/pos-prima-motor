import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    StockAdjustment,
    StockAdjustmentInsert,
    StockAdjustmentWithItem,
    PaginatedResponse,
} from '@/lib/types/database'

type StockAdjustmentFilters = {
    itemId?: number
    page?: number
    limit?: number
}

export async function getStockAdjustments(
    supabase: SupabaseClient,
    filters: StockAdjustmentFilters = {},
): Promise<{ data: PaginatedResponse<StockAdjustmentWithItem> | null; error: Error | null }> {
    try {
        const { itemId, page = 1, limit = 10 } = filters
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('stock_adjustments')
            .select('*, items(id, name, sku)', { count: 'exact' })
            .order('adjustment_date', { ascending: false })
            .range(from, to)

        if (itemId) {
            query = query.eq('item_id', itemId)
        }

        const { data, error, count } = await query

        if (error) return { data: null, error: new Error(error.message) }

        const mapped = (data ?? []).map((r) => ({
            ...r,
            item: r.items ?? null,
            items: undefined,
        }))

        return {
            data: {
                data: mapped as StockAdjustmentWithItem[],
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

/**
 * Buat penyesuaian stok + otomatis catat ke stock_movements
 * (agar stock_summary view ikut terhitung).
 */
export async function createStockAdjustment(
    supabase: SupabaseClient,
    data: StockAdjustmentInsert,
): Promise<{ data: StockAdjustment | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('stock_adjustments')
            .insert({
                ...data,
                quantity: Number(data.quantity),
                notes: data.notes?.trim() ? data.notes.trim() : null,
            })
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed to create adjustment') }

        // Catat ke stock_movements supaya stock_summary view ter-update
        const { error: movError } = await supabase.from('stock_movements').insert({
            item_id: data.item_id,
            type: data.type,
            quantity: Number(data.quantity),
            reference_type: 'adjustment',
            reference_id: row.id,
        })

        if (movError) {
            // Jangan gagalkan transaksi utama — tapi laporkan
            console.error('Failed to record stock movement for adjustment', movError)
        }

        return { data: row as StockAdjustment, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}
