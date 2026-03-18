import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  StockSummary,
  StockMovement,
  LowStockAlert,
  PaginatedResponse,
} from '@/lib/types/database'

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
  const { search, stock_status, page = 1, limit = 10 } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('stock_summary')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  if (stock_status === 'low') {
    query = query.lte('current_stock', 5)
  } else if (stock_status === 'critical') {
    query = query.lte('current_stock', 2)
  }

  const { data, error, count } = await query
    .order('current_stock', { ascending: true })
    .range(from, to)

  if (error) return { data: null, error }

  return {
    data: {
      data: data as StockSummary[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    error: null,
  }
}

export async function getStockMovements(
  supabase: SupabaseClient,
  itemId?: number,
  page: number = 1,
  limit: number = 20,
) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('stock_movements')
    .select('*, item:items(name, sku)', { count: 'exact' })

  if (itemId) {
    query = query.eq('item_id', itemId)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: null, error }

  return {
    data: {
      data: data as (StockMovement & { item: { name: string; sku: string } })[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    error: null,
  }
}

export async function getLowStockItems(
  supabase: SupabaseClient,
  threshold: number = 5,
): Promise<{ data: LowStockAlert[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('stock_summary')
    .select('item_id, name, sku, current_stock')
    .lte('current_stock', threshold)
    .order('current_stock', { ascending: true })

  if (error) return { data: null, error }
  return { data: data as LowStockAlert[], error: null }
}
