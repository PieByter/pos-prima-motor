import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Sale,
  SaleInsert,
  SaleUpdate,
  SaleDetailInsert,
  SaleWithDetails,
  PaginatedResponse,
} from '@/lib/types/database'

type SaleFilters = {
  search?: string
  customer_id?: number
  mechanic_id?: string
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

type SaleListItem = Sale & {
  customer?: { name: string | null } | null
  mechanic?: { name: string | null } | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSale(row: any): Sale {
  return {
    ...row,
    total_amount: Number(row.total_amount),
  }
}

export async function getSales(
  supabase: SupabaseClient,
  filters: SaleFilters = {},
): Promise<{ data: PaginatedResponse<Sale> | null; error: Error | null }> {
  try {
    const { search, customer_id, mechanic_id, status, start_date, end_date, page = 1, limit = 10 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('sales')
      .select('*, customers(name), profiles(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) query = query.ilike('invoice_number', `%${search}%`)
    if (customer_id) query = query.eq('customer_id', customer_id)
    if (mechanic_id) query = query.eq('mechanic_id', mechanic_id)
    if (status) query = query.eq('status', status)
    if (start_date) query = query.gte('sale_date', start_date)
    if (end_date) query = query.lte('sale_date', end_date)

    const { data, error, count } = await query
    if (error) return { data: null, error: new Error(error.message) }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched: SaleListItem[] = (data ?? []).map((r: any) => ({
      ...mapSale(r),
      customer: r.customers ?? null,
      mechanic: r.profiles ?? null,
      customers: undefined,
      profiles: undefined,
    }))

    return {
      data: {
        data: enriched,
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

export async function getSaleById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: SaleWithDetails | null; error: Error | null }> {
  try {
    const { data: sale, error } = await supabase
      .from('sales')
      .select('*, customers(*), profiles(*)')
      .eq('id', id)
      .single()

    if (error || !sale) return { data: null, error: new Error('Sale not found') }

    const { data: detailRows } = await supabase
      .from('sale_details')
      .select('*, items(*)')
      .eq('sale_id', id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const details = (detailRows ?? []).map((r: any) => ({
      ...r,
      base_price: Number(r.base_price),
      discount_amount: Number(r.discount_amount),
      final_price: Number(r.final_price),
      service_fee: Number(r.service_fee),
      subtotal: Number(r.subtotal),
      item: r.items ? {
        ...r.items,
        purchase_price: Number(r.items.purchase_price),
        selling_price: Number(r.items.selling_price),
        service_fee: Number(r.items.service_fee),
      } : undefined,
      items: undefined,
    }))

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        ...mapSale(sale),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        customer: (sale as any).customers ?? null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mechanic: (sale as any).profiles ?? undefined,
        details,
      } as SaleWithDetails,
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createSale(
  supabase: SupabaseClient,
  header: SaleInsert,
  details: Omit<SaleDetailInsert, 'sale_id'>[],
): Promise<{ data: Sale | null; error: Error | null }> {
  try {
    // 1. Validate stock
    for (const detail of details) {
      const { data: stockRows } = await supabase
        .from('stock_movements')
        .select('type, quantity')
        .eq('item_id', detail.item_id)

      const currentStock = (stockRows ?? []).reduce(
        (acc, sm) => acc + (sm.type === 'IN' ? sm.quantity : -sm.quantity), 0)

      if (currentStock < detail.quantity) {
        return {
          data: null,
          error: new Error(`Insufficient stock for item ${detail.item_id}. Available: ${currentStock}, Requested: ${detail.quantity}`),
        }
      }
    }

    // 2. Insert sale header
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert(header)
      .select()
      .single()

    if (saleError || !sale) return { data: null, error: new Error(saleError?.message ?? 'Failed to create sale') }

    // 3. Insert sale details
    const detailsWithId = details.map((d) => ({ ...d, sale_id: sale.id }))
    const { error: detailsError } = await supabase.from('sale_details').insert(detailsWithId)

    if (detailsError) {
      await supabase.from('sales').delete().eq('id', sale.id)
      return { data: null, error: new Error(detailsError.message) }
    }

    // 4. Insert stock movements
    const stockMovs = details.map((d) => ({
      item_id: d.item_id,
      type: 'OUT' as const,
      quantity: d.quantity,
      reference_type: 'sale' as const,
      reference_id: sale.id,
    }))
    const { error: stockError } = await supabase.from('stock_movements').insert(stockMovs)

    if (stockError) {
      await supabase.from('sale_details').delete().eq('sale_id', sale.id)
      await supabase.from('sales').delete().eq('id', sale.id)
      return { data: null, error: new Error(stockError.message) }
    }

    return { data: mapSale(sale), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updateSale(
  supabase: SupabaseClient,
  id: number,
  header: SaleUpdate,
): Promise<{ data: Sale | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('sales')
      .update({ ...header, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !row) return { data: null, error: new Error('Sale not found') }
    return { data: mapSale(row), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deleteSale(
  supabase: SupabaseClient,
  id: number,
): Promise<{ error: Error | null }> {
  try {
    await supabase.from('stock_movements').delete().eq('reference_type', 'sale').eq('reference_id', id)
    await supabase.from('sale_details').delete().eq('sale_id', id)
    const { error } = await supabase.from('sales').delete().eq('id', id)
    return { error: error ? new Error(error.message) : null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function generateInvoiceNumber(
  supabase: SupabaseClient,
  prefix: string = 'INV',
): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .ilike('invoice_number', `${prefix}-${year}-%`)

  const nextNum = (count ?? 0) + 1
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}
