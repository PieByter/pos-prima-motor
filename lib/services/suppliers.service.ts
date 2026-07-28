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

function normalizeSupplierInsert(data: SupplierInsert): SupplierInsert {
  return {
    ...data,
    name: data.name.trim(),
    phone: data.phone?.trim() ? data.phone.trim() : null,
    address: data.address?.trim() ? data.address.trim() : null,
  }
}

function normalizeSupplierUpdate(data: SupplierUpdate): SupplierUpdate {
  return {
    ...data,
    name: data.name?.trim(),
    phone: data.phone?.trim() ? data.phone.trim() : null,
    address: data.address?.trim() ? data.address.trim() : null,
  }
}

export async function getSuppliers(
  supabase: SupabaseClient,
  filters: SupplierFilters = {},
): Promise<{ data: PaginatedResponse<Supplier> | null; error: Error | null }> {
  try {
    const { search, page = 1, limit = 10 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('suppliers')
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
        data: (data ?? []) as Supplier[],
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

export async function getSupplierById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: Supplier | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return { data: null, error: new Error('Supplier not found') }
    return { data: data as Supplier, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createSupplier(
  supabase: SupabaseClient,
  data: SupplierInsert,
): Promise<{ data: Supplier | null; error: Error | null }> {
  try {
    const normalizedData = normalizeSupplierInsert(data)
    const { data: row, error } = await supabase
      .from('suppliers')
      .insert(normalizedData)
      .select()
      .single()

    if (error || !row) {
      return { data: null, error: new Error(error?.message ?? 'Failed to create supplier') }
    }

    return { data: row as Supplier, error: null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to create supplier')
    return { data: null, error }
  }
}

export async function updateSupplier(
  supabase: SupabaseClient,
  id: number,
  data: SupplierUpdate,
): Promise<{ data: Supplier | null; error: Error | null }> {
  try {
    const normalizedData = normalizeSupplierUpdate(data)
    const { data: row, error } = await supabase
      .from('suppliers')
      .update({ ...normalizedData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !row) return { data: null, error: new Error('Supplier not found') }
    return { data: row as Supplier, error: null }
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Failed to update supplier')
    return { data: null, error }
  }
}

export async function deleteSupplier(
  supabase: SupabaseClient,
  id: number,
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from('suppliers').delete().eq('id', id)
    return { error: error ? new Error(error.message) : null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function bulkDeleteSuppliers(
  supabase: SupabaseClient,
  ids: number[],
): Promise<{ deleted: number; error: Error | null }> {
  try {
    const { error, count } = await supabase.from('suppliers').delete().in('id', ids).select('id')
    return { deleted: count ?? 0, error: error ? new Error(error.message) : null }
  } catch (err) {
    return { deleted: 0, error: err as Error }
  }
}
