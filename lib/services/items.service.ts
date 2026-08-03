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

type SupabaseRow = Record<string, unknown>

type SupplierEmbed = { id: number; name: string } | null
type LinkRow = { suppliers?: SupplierEmbed; purchase_price?: string | number | null }

/** Extract suppliers with per-supplier purchase price from item_suppliers embed */
function mapSuppliers(row: SupabaseRow): { id: number; name: string; purchase_price: number | null }[] {
  const links = (row.item_suppliers as LinkRow[] | undefined) ?? []
  const result: { id: number; name: string; purchase_price: number | null }[] = []
  for (const l of links) {
    const s = l.suppliers
    if (s) {
      result.push({
        id: s.id,
        name: s.name,
        purchase_price: l.purchase_price != null ? Number(l.purchase_price) : null,
      })
    }
  }
  return result
}

/** Ensure numeric fields come back as numbers (Postgres returns decimal as string) */
function mapItem(row: SupabaseRow): Item {
  return {
    ...row,
    purchase_price: Number(row.purchase_price),
    selling_price: Number(row.selling_price),
    service_fee: Number(row.service_fee),
    warranty_months: row.warranty_months != null ? Number(row.warranty_months) : null,
    category_name: (row.categories as Record<string, string> | undefined)?.name ?? null,
    brand_name: (row.brands as Record<string, string> | undefined)?.name ?? null,
    supplier_ids: mapSuppliers(row).map((s) => s.id),
    suppliers: mapSuppliers(row),
    categories: undefined,
    brands: undefined,
    item_suppliers: undefined,
  } as unknown as Item
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
      .select('*, categories(name), brands(name), item_suppliers(purchase_price, suppliers(id, name))', { count: 'exact' })
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
      .select('*, categories(name), brands(name), item_suppliers(purchase_price, suppliers(id, name))')
      .eq('id', id)
      .single()

    if (error || !data) return { data: null, error: new Error('Item not found') }
    return { data: mapItem(data), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

/** Replace an item's supplier links in the junction table (with optional per-supplier price) */
async function replaceItemSuppliers(
  supabase: SupabaseClient,
  itemId: number,
  links: { supplier_id: number; purchase_price?: number | null }[] = [],
): Promise<Error | null> {
  try {
    await supabase.from('item_suppliers').delete().eq('item_id', itemId)
    if (links.length > 0) {
      const rows = links.map((l) => ({
        item_id: itemId,
        supplier_id: l.supplier_id,
        purchase_price: l.purchase_price != null ? Number(l.purchase_price) : null,
      }))
      const { error } = await supabase.from('item_suppliers').insert(rows)
      if (error) return new Error(error.message)
    }
    return null
  } catch (err) {
    return err as Error
  }
}

export async function createItem(
  supabase: SupabaseClient,
  data: ItemInsert,
): Promise<{ data: Item | null; error: Error | null }> {
  try {
    const { supplier_ids, supplier_links, ...rest } = data

    // supplier_links lebih prioritas (bisa bawa harga per supplier);
    // fallback: supplier_ids → harga null
    const links = supplier_links
      ?? (supplier_ids ?? []).map((supplier_id) => ({ supplier_id }))

    const { data: row, error } = await supabase
      .from('items')
      .insert(rest)
      .select()
      .single()

    if (error || !row) {
      return { data: null, error: new Error(error?.message ?? 'Failed to create item') }
    }

    const relError = await replaceItemSuppliers(supabase, row.id, links)
    if (relError) {
      await supabase.from('items').delete().eq('id', row.id)
      return { data: null, error: relError }
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
    const { supplier_ids, supplier_links, ...rest } = data

    const links = supplier_links
      ?? (supplier_ids ? supplier_ids.map((supplier_id) => ({ supplier_id })) : undefined)

    const { data: row, error } = await supabase
      .from('items')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !row) return { data: null, error: new Error('Item not found') }

    if (links) {
      const relError = await replaceItemSuppliers(supabase, id, links)
      if (relError) return { data: null, error: relError }
    }

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

export async function bulkDeleteItems(
  supabase: SupabaseClient,
  ids: number[],
): Promise<{ deleted: number; error: Error | null }> {
  try {
    const { error, count } = await supabase.from('items').delete().in('id', ids).select('id')
    return { deleted: count ?? 0, error: error ? new Error(error.message) : null }
  } catch (err) {
    return { deleted: 0, error: err as Error }
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
