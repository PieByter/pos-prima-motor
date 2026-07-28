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

function normalizeCustomerInsert(data: CustomerInsert): CustomerInsert {
  return {
    ...data,
    name: data.name.trim(),
    phone: data.phone?.trim() ? data.phone.trim() : null,
    address: data.address?.trim() ? data.address.trim() : null,
  }
}

function normalizeCustomerUpdate(data: CustomerUpdate): CustomerUpdate {
  return {
    ...data,
    name: data.name?.trim(),
    phone: data.phone?.trim() ? data.phone.trim() : null,
    address: data.address?.trim() ? data.address.trim() : null,
  }
}

export async function getCustomers(
  supabase: SupabaseClient,
  filters: CustomerFilters = {},
): Promise<{ data: PaginatedResponse<Customer> | null; error: Error | null }> {
  try {
    const { search, page = 1, limit = 10 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) {
      return { data: null, error: new Error(error.message) }
    }

    return {
      data: {
        data: (data ?? []) as Customer[],
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

export async function getCustomerById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: Customer | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return { data: null, error: new Error('Customer not found') }
    return { data: data as Customer, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createCustomer(
  supabase: SupabaseClient,
  data: CustomerInsert,
): Promise<{ data: Customer | null; error: Error | null }> {
  try {
    const normalizedData = normalizeCustomerInsert(data)
    const { data: row, error } = await supabase
      .from('customers')
      .insert(normalizedData)
      .select()
      .single()

    if (error || !row) {
      return { data: null, error: new Error(error?.message ?? 'Failed to create customer') }
    }

    return { data: row as Customer, error: null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to create customer')
    return { data: null, error }
  }
}

export async function updateCustomer(
  supabase: SupabaseClient,
  id: number,
  data: CustomerUpdate,
): Promise<{ data: Customer | null; error: Error | null }> {
  try {
    const normalizedData = normalizeCustomerUpdate(data)
    const { data: row, error } = await supabase
      .from('customers')
      .update({ ...normalizedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !row) return { data: null, error: new Error('Customer not found') }
    return { data: row as Customer, error: null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to update customer')
    return { data: null, error }
  }
}

export async function deleteCustomer(
  supabase: SupabaseClient,
  id: number,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('customers').delete().eq('id', id)
    return { error: error ? new Error(error.message) : null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function bulkDeleteCustomers(
  supabase: SupabaseClient,
  ids: number[],
): Promise<{ deleted: number; error: Error | null }> {
  try {
    const { error, count } = await supabase.from('customers').delete().in('id', ids).select('id')
    return { deleted: count ?? 0, error: error ? new Error(error.message) : null }
  } catch (err) {
    return { deleted: 0, error: err as Error }
  }
}
