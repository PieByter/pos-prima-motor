import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Discount,
  DiscountInsert,
  DiscountUpdate,
  DiscountWithItems,
  PaginatedResponse,
} from '@/lib/types/database'

type DiscountFilters = {
  search?: string
  is_active?: boolean
  page?: number
  limit?: number
}

export async function getDiscounts(
  supabase: SupabaseClient,
  filters: DiscountFilters = {},
): Promise<{ data: PaginatedResponse<Discount> | null; error: Error | null }> {
  const { search, is_active, page = 1, limit = 10 } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from('discounts').select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }
  if (is_active !== undefined) {
    query = query.eq('is_active', is_active)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: null, error }

  return {
    data: {
      data: data as Discount[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    error: null,
  }
}

export async function getDiscountById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: DiscountWithItems | null; error: Error | null }> {
  const { data: discount, error } = await supabase
    .from('discounts')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return { data: null, error }

  // Get linked items
  const { data: discountItems } = await supabase
    .from('discount_items')
    .select('item:items(*)')
    .eq('discount_id', id)

  const items = (discountItems ?? []).map((di: { item: unknown }) => di.item)

  return { data: { ...discount, items } as DiscountWithItems, error: null }
}

export async function createDiscount(
  supabase: SupabaseClient,
  data: DiscountInsert,
  itemIds: number[] = [],
) {
  const { data: discount, error } = await supabase
    .from('discounts')
    .insert(data)
    .select()
    .single<Discount>()

  if (error || !discount) return { data: null, error }

  // Link items
  if (itemIds.length > 0) {
    const links = itemIds.map((item_id) => ({
      discount_id: discount.id,
      item_id,
    }))
    await supabase.from('discount_items').insert(links)
  }

  return { data: discount, error: null }
}

export async function updateDiscount(
  supabase: SupabaseClient,
  id: number,
  data: DiscountUpdate,
  itemIds?: number[],
) {
  const { data: discount, error } = await supabase
    .from('discounts')
    .update(data)
    .eq('id', id)
    .select()
    .single<Discount>()

  if (error) return { data: null, error }

  // Update linked items if provided
  if (itemIds !== undefined) {
    await supabase.from('discount_items').delete().eq('discount_id', id)
    if (itemIds.length > 0) {
      const links = itemIds.map((item_id) => ({
        discount_id: id,
        item_id,
      }))
      await supabase.from('discount_items').insert(links)
    }
  }

  return { data: discount, error: null }
}

export async function deleteDiscount(supabase: SupabaseClient, id: number) {
  return supabase.from('discounts').delete().eq('id', id)
}

export async function getApplicableDiscounts(
  supabase: SupabaseClient,
  itemIds: number[],
  totalAmount: number,
) {
  const now = new Date().toISOString().split('T')[0]

  // Fetch active discounts within date range
  const query = supabase
    .from('discounts')
    .select('*, discount_items(item_id)')
    .eq('is_active', true)
    .lte('min_transaction', totalAmount)
    .or(`start_date.is.null,start_date.lte.${now}`)
    .or(`end_date.is.null,end_date.gte.${now}`)

  const { data: discounts, error } = await query

  if (error) return { data: null, error }

  // Filter: discounts that apply to any of the cart items, or have no item restrictions
  const applicable = (discounts ?? []).filter((d: Discount & { discount_items: { item_id: number }[] }) => {
    if (!d.discount_items || d.discount_items.length === 0) return true // applies to all
    return d.discount_items.some((di) => itemIds.includes(di.item_id))
  })

  return { data: applicable, error: null }
}
