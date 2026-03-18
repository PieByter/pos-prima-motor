import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  PaginatedResponse,
} from '@/lib/types/database'

type CustomerFilters = {
  search?: string
  page?: number
  limit?: number
}

export async function getCustomers(
  supabase: SupabaseClient,
  filters: CustomerFilters = {},
): Promise<{ data: PaginatedResponse<Customer> | null; error: Error | null }> {
  const { search, page = 1, limit = 10 } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase.from('customers').select('*', { count: 'exact' })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: null, error }

  return {
    data: {
      data: data as Customer[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    error: null,
  }
}

export async function getCustomerById(supabase: SupabaseClient, id: number) {
  return supabase.from('customers').select('*').eq('id', id).single<Customer>()
}

export async function createCustomer(
  supabase: SupabaseClient,
  data: CustomerInsert,
) {
  return supabase.from('customers').insert(data).select().single<Customer>()
}

export async function updateCustomer(
  supabase: SupabaseClient,
  id: number,
  data: CustomerUpdate,
) {
  return supabase
    .from('customers')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<Customer>()
}

export async function deleteCustomer(supabase: SupabaseClient, id: number) {
  return supabase.from('customers').delete().eq('id', id)
}
