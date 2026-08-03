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
  sale_type?: string
  payment_status?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

type SaleListItem = Sale & {
  customer?: { name: string | null } | null
  mechanic?: { name: string | null } | null
  vehicle?: { plate_number: string | null; brand: string | null; model: string | null } | null
}

type SupabaseRow = Record<string, unknown>

function mapSale(row: SupabaseRow): Sale {
  return {
    ...row,
    total_amount: Number(row.total_amount),
    paid_amount: row.paid_amount != null ? Number(row.paid_amount) : null,
    remaining_amount: row.remaining_amount != null ? Number(row.remaining_amount) : null,
    cash_amount: row.cash_amount != null ? Number(row.cash_amount) : null,
    change_amount: row.change_amount != null ? Number(row.change_amount) : null,
  } as unknown as Sale
}

export async function getSales(
  supabase: SupabaseClient,
  filters: SaleFilters = {},
): Promise<{ data: PaginatedResponse<Sale> | null; error: Error | null }> {
  try {
    const { search, customer_id, mechanic_id, status, sale_type, payment_status, start_date, end_date, page = 1, limit = 10 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('sales')
      .select('*, customers(name), profiles!sales_mechanic_id_profiles_id_fk(name), vehicles(plate_number, brand, model)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) query = query.ilike('invoice_number', `%${search}%`)
    if (customer_id) query = query.eq('customer_id', customer_id)
    if (mechanic_id) query = query.eq('mechanic_id', mechanic_id)
    if (status) query = query.eq('status', status)
    if (sale_type) query = query.eq('sale_type', sale_type)
    if (payment_status) query = query.eq('payment_status', payment_status)
    if (start_date) query = query.gte('sale_date', start_date)
    if (end_date) query = query.lte('sale_date', end_date)

    const { data, error, count } = await query
    if (error) return { data: null, error: new Error(error.message) }

    const enriched: SaleListItem[] = (data ?? []).map((r) => ({
      ...mapSale(r),
      customer: r.customers ?? null,
      mechanic: r.profiles ?? null,
      vehicle: r.vehicles ?? null,
      customers: undefined,
      profiles: undefined,
      vehicles: undefined,
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
      .select('*, customers(*), profiles!sales_mechanic_id_profiles_id_fk(*), payment_methods(*), vehicles(*)')
      .eq('id', id)
      .single()

    if (error || !sale) return { data: null, error: new Error('Sale not found') }

    const { data: detailRows } = await supabase
      .from('sale_details')
      .select('*, items(*)')
      .eq('sale_id', id)

    const details = (detailRows ?? []).map((r) => ({
      ...r,
      base_price: Number(r.base_price),
      discount_amount: Number(r.discount_amount),
      final_price: Number(r.final_price),
      service_fee: Number(r.service_fee),
      subtotal: Number(r.subtotal),
      item: r.items ? {
        ...(r.items as SupabaseRow),
        purchase_price: Number((r.items as SupabaseRow).purchase_price),
        selling_price: Number((r.items as SupabaseRow).selling_price),
        service_fee: Number((r.items as SupabaseRow).service_fee),
      } : undefined,
      items: undefined,
    }))

    return {
      data: {
        ...mapSale(sale),
        customer: sale.customers ?? null,
        vehicle: sale.vehicles ?? null,
        mechanic: sale.profiles ?? undefined,
        payment_method: sale.payment_methods ?? undefined,
        details,
      } as unknown as SaleWithDetails,
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
