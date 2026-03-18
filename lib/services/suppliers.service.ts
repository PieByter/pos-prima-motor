import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Supplier,
  SupplierInsert,
  SupplierUpdate,
  PaginatedResponse,
} from '@/lib/types/database'

type SupplierFilters = {
  search?: string
  page?: number
  limit?: number
}

export async function getSuppliers(
  supabase: SupabaseClient,
  filters: SupplierFilters = {},
): Promise<{ data: PaginatedResponse<Supplier> | null; error: Error | null }> {
  const { search, page = 1, limit = 10 } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from('suppliers').select('*', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: null, error }

  return {
    data: {
      data: data as Supplier[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    error: null,
  }
}

export async function getSupplierById(supabase: SupabaseClient, id: number) {
  return supabase.from('suppliers').select('*').eq('id', id).single<Supplier>()
}

export async function createSupplier(
  supabase: SupabaseClient,
  data: SupplierInsert,
) {
  return supabase.from('suppliers').insert(data).select().single<Supplier>()
}

export async function updateSupplier(
  supabase: SupabaseClient,
  id: number,
  data: SupplierUpdate,
) {
  return supabase
    .from('suppliers')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<Supplier>()
}

export async function deleteSupplier(supabase: SupabaseClient, id: number) {
  return supabase.from('suppliers').delete().eq('id', id)
}
