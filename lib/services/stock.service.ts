import type { SupabaseClient } from '@supabase/supabase-js'
import type { StockSummary, StockMovement, LowStockAlert, PaginatedResponse } from '@/lib/types/database'

type StockFilters = {
  search?: string
  stock_status?: 'all' | 'low' | 'critical'
  page?: number
  limit?: number
}

export async function getStockSummary(
  supabase: SupabaseClient,
  filters: StockFilters = {},
): Promise<{ data: PaginatedResponse<StockSummary> | null; error: Error | null }> {
  try {
    const { search, stock_status, page = 1, limit = 10 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('stock_summary')
      .select('*', { count: 'exact' })
      .order('current_stock', { ascending: true })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }
    if (stock_status === 'low') {
      query = query.lte('current_stock', 5)
    } else if (stock_status === 'critical') {
      query = query.lte('current_stock', 2)
    }

    const { data, error, count } = await query

    if (error) return { data: null, error: new Error(error.message) }

    return {
      data: {
        data: (data ?? []) as StockSummary[],
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

export async function getStockMovements(
  supabase: SupabaseClient,
  itemId?: number,
  page: number = 1,
  limit: number = 20,
): Promise<{ data: PaginatedResponse<StockMovement & { item: { name: string; sku: string } }> | null; error: Error | null }> {
  try {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('stock_movements')
      .select('*, items(name, sku)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (itemId) {
      query = query.eq('item_id', itemId)
    }

    const { data, error, count } = await query

    if (error) return { data: null, error: new Error(error.message) }

    const mapped = (data ?? []).map((r) => ({
      ...r,
      item: { name: r.items?.name ?? '', sku: r.items?.sku ?? '' },
      items: undefined,
    }))

    return {
      data: {
        data: mapped as (StockMovement & { item: { name: string; sku: string } })[],
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

export async function getLowStockItems(
  supabase: SupabaseClient,
  threshold: number = 5,
): Promise<{ data: LowStockAlert[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('stock_summary')
      .select('item_id, name, sku, current_stock')
      .lte('current_stock', threshold)
      .order('current_stock', { ascending: true })

    if (error) return { data: null, error: new Error(error.message) }
    return { data: (data ?? []) as LowStockAlert[], error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
