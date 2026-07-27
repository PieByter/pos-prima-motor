import type { SupabaseClient } from '@supabase/supabase-js'
import type { Item, ItemInsert, ItemUpdate, PaginatedResponse } from '@/lib/types/database'

type ItemFilters = {
  search?: string
  category?: string
  category_id?: number
  brand_id?: number
  page?: number
  limit?: number
}

/** Ensure numeric fields come back as numbers (Postgres returns decimal as string) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapItem(row: any): Item {
  return {
    ...row,
    purchase_price: Number(row.purchase_price),
    selling_price: Number(row.selling_price),
    service_fee: Number(row.service_fee),
    category_name: row.categories?.name ?? null,
    brand_name: row.brands?.name ?? null,
    categories: undefined,
    brands: undefined,
  }
}

export async function getItems(
  supabase: SupabaseClient,
  filters: ItemFilters = {},
): Promise<{ data: PaginatedResponse<Item> | null; error: Error | null }> {
  try {
    const { search, category, category_id, brand_id, page = 1, limit = 10 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('items')
      .select('*, categories(name), brands(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
    }
    if (category) {
      query = query.eq('category', category)
    }
    if (category_id) {
      query = query.eq('category_id', category_id)
    }
    if (brand_id) {
      query = query.eq('brand_id', brand_id)
    }

    const { data, error, count } = await query

    if (error) return { data: null, error: new Error(error.message) }

    return {
      data: {
        data: (data ?? []).map(mapItem),
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

export async function getItemById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: Item | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return { data: null, error: new Error('Item not found') }
    return { data: mapItem(data), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createItem(
  supabase: SupabaseClient,
  data: ItemInsert,
): Promise<{ data: Item | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('items')
      .insert(data)
      .select()
      .single()

    if (error || !row) {
      return { data: null, error: new Error(error?.message ?? 'Failed to create item') }
    }
    return { data: mapItem(row), error: null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to create item')
    return { data: null, error }
  }
}

export async function updateItem(
  supabase: SupabaseClient,
  id: number,
  data: ItemUpdate,
): Promise<{ data: Item | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('items')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !row) return { data: null, error: new Error('Item not found') }
    return { data: mapItem(row), error: null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to update item')
    return { data: null, error }
  }
}

export async function deleteItem(
  supabase: SupabaseClient,
  id: number,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('items').delete().eq('id', id)
    return { error: error ? new Error(error.message) : null }
  } catch (err) {
    return { error: err as Error }
  }
}

// File upload uses Supabase Storage (not a DB operation)
export async function uploadItemPicture(supabase: SupabaseClient, file: File, fileName: string) {
  const { data, error } = await supabase.storage
    .from('item-pictures')
    .upload(`items/${fileName}`, file, { cacheControl: '3600', upsert: true })

  if (error) return { data: null, error }

  const {
    data: { publicUrl },
  } = supabase.storage.from('item-pictures').getPublicUrl(data.path)

  return { data: { path: data.path, publicUrl }, error: null }
}
