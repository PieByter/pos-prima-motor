import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Discount,
  DiscountInsert,
  DiscountUpdate,
  DiscountWithItems,
  Item,
  PaginatedResponse,
} from '@/lib/types/database'

type DiscountFilters = {
  search?: string
  is_active?: boolean
  page?: number
  limit?: number
}

type SupabaseRow = Record<string, unknown>

function mapDiscount(row: SupabaseRow): Discount {
  return {
    ...row,
    value: Number(row.value),
    min_transaction: Number(row.min_transaction),
    max_percent: row.max_percent !== null ? Number(row.max_percent) : null,
  } as unknown as Discount
}

function mapItem(row: SupabaseRow): Item {
  return {
    ...row,
    purchase_price: Number(row.purchase_price),
    selling_price: Number(row.selling_price),
    service_fee: Number(row.service_fee),
  } as unknown as Item
}

export async function getDiscounts(
  supabase: SupabaseClient,
  filters: DiscountFilters = {},
): Promise<{ data: PaginatedResponse<Discount> | null; error: Error | null }> {
  try {
    const { search, is_active, page = 1, limit = 10 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('discounts')
      .select('*', { count: 'exact' })
      .order('id', { ascending: false })
      .range(from, to)

    if (search) query = query.ilike('name', `%${search}%`)
    if (is_active !== undefined) query = query.eq('is_active', is_active)

    const { data, error, count } = await query
    if (error) return { data: null, error: new Error(error.message) }

    return {
      data: {
        data: (data ?? []).map(mapDiscount),
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

export async function getDiscountById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: DiscountWithItems | null; error: Error | null }> {
  try {
    const { data: discount, error } = await supabase.from('discounts').select('*').eq('id', id).single()
    if (error || !discount) return { data: null, error: new Error('Discount not found') }

    const { data: linkedItems } = await supabase.from('discount_items').select('items(*)').eq('discount_id', id)
    const items = (linkedItems ?? []).map((r) => mapItem(r.items as unknown as SupabaseRow)).filter(Boolean)

    return { data: { ...mapDiscount(discount), items } as unknown as DiscountWithItems, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createDiscount(
  supabase: SupabaseClient,
  data: DiscountInsert,
  itemIds: number[] = [],
): Promise<{ data: Discount | null; error: Error | null }> {
  try {
    const { data: discount, error } = await supabase.from('discounts').insert(data).select().single()
    if (error || !discount) return { data: null, error: new Error(error?.message ?? 'Failed to create discount') }

    if (itemIds.length > 0) {
      const { error: linkError } = await supabase
        .from('discount_items')
        .insert(itemIds.map((item_id) => ({ discount_id: discount.id, item_id })))
      if (linkError) {
        await supabase.from('discounts').delete().eq('id', discount.id)
        return { data: null, error: new Error(linkError.message) }
      }
    }
    return { data: mapDiscount(discount), error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to create discount') }
  }
}

export async function updateDiscount(
  supabase: SupabaseClient,
  id: number,
  data: DiscountUpdate,
  itemIds?: number[],
): Promise<{ data: Discount | null; error: Error | null }> {
  try {
    const { data: discount, error } = await supabase.from('discounts').update(data).eq('id', id).select().single()
    if (error || !discount) return { data: null, error: new Error('Discount not found') }

    if (itemIds !== undefined) {
      await supabase.from('discount_items').delete().eq('discount_id', id)
      if (itemIds.length > 0) {
        const { error: linkError } = await supabase
          .from('discount_items')
          .insert(itemIds.map((item_id) => ({ discount_id: id, item_id })))
        if (linkError) return { data: null, error: new Error(linkError.message) }
      }
    }
    return { data: mapDiscount(discount), error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Failed to update discount') }
  }
}

export async function deleteDiscount(supabase: SupabaseClient, id: number): Promise<{ error: Error | null }> {
  try {
    await supabase.from('discount_items').delete().eq('discount_id', id)
    const { error } = await supabase.from('discounts').delete().eq('id', id)
    return { error: error ? new Error(error.message) : null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function getApplicableDiscounts(
  supabase: SupabaseClient,
  itemIds: number[],
  totalAmount: number,
): Promise<{ data: (Discount & { discount_items: { item_id: number }[] })[] | null; error: Error | null }> {
  try {
    const now = new Date().toISOString().split('T')[0]
    const { data: rows, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('is_active', true)
      .lte('min_transaction', String(totalAmount))
      .or(`start_date.is.null,start_date.lte.${now}`)
      .or(`end_date.is.null,end_date.gte.${now}`)

    if (error) return { data: null, error: new Error(error.message) }
    if (!rows || rows.length === 0) return { data: [], error: null }

    const discountIds = rows.map((d) => d.id)
    const { data: links } = await supabase.from('discount_items').select('discount_id, item_id').in('discount_id', discountIds)

    const linkMap = new Map<number, { item_id: number }[]>()
    for (const link of links ?? []) {
      const arr = linkMap.get(link.discount_id) ?? []
      arr.push({ item_id: link.item_id })
      linkMap.set(link.discount_id, arr)
    }

    const applicable = rows
      .map((d) => ({ ...mapDiscount(d), discount_items: linkMap.get(d.id) ?? [] }))
      .filter((d) => d.discount_items.length === 0 || d.discount_items.some((di) => itemIds.includes(di.item_id)))

    return { data: applicable as (Discount & { discount_items: { item_id: number }[] })[], error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
