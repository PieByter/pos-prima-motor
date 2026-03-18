import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Item,
  ItemInsert,
  ItemUpdate,
  PaginatedResponse,
} from '@/lib/types/database'

type ItemFilters = {
  search?: string
  category?: string
  page?: number
  limit?: number
}

export async function getItems(
  supabase: SupabaseClient,
  filters: ItemFilters = {},
): Promise<{ data: PaginatedResponse<Item> | null; error: Error | null }> {
  const { search, category, page = 1, limit = 10 } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from('items').select('*', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }
  if (category) {
    query = query.eq('category', category)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: null, error }

  return {
    data: {
      data: data as Item[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    error: null,
  }
}

export async function getItemById(supabase: SupabaseClient, id: number) {
  return supabase.from('items').select('*').eq('id', id).single<Item>()
}

export async function createItem(supabase: SupabaseClient, data: ItemInsert) {
  return supabase.from('items').insert(data).select().single<Item>()
}

export async function updateItem(
  supabase: SupabaseClient,
  id: number,
  data: ItemUpdate,
) {
  return supabase
    .from('items')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<Item>()
}

export async function deleteItem(supabase: SupabaseClient, id: number) {
  return supabase.from('items').delete().eq('id', id)
}

export async function uploadItemPicture(
  supabase: SupabaseClient,
  file: File,
  fileName: string,
) {
  const { data, error } = await supabase.storage
    .from('item-pictures')
    .upload(`items/${fileName}`, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) return { data: null, error }

  const {
    data: { publicUrl },
  } = supabase.storage.from('item-pictures').getPublicUrl(data.path)

  return { data: { path: data.path, publicUrl }, error: null }
}
