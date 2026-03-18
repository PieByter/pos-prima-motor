import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Sale,
  SaleInsert,
  SaleUpdate,
  SaleDetailInsert,
  SaleWithDetails,
  PaginatedResponse,
  StockMovementInsert,
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

export async function getSales(
  supabase: SupabaseClient,
  filters: SaleFilters = {},
): Promise<{ data: PaginatedResponse<Sale> | null; error: Error | null }> {
  const {
    search,
    customer_id,
    mechanic_id,
    status,
    start_date,
    end_date,
    page = 1,
    limit = 10,
  } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('sales')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('invoice_number', `%${search}%`)
  }
  if (customer_id) {
    query = query.eq('customer_id', customer_id)
  }
  if (mechanic_id) {
    query = query.eq('mechanic_id', mechanic_id)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (start_date) {
    query = query.gte('sale_date', start_date)
  }
  if (end_date) {
    query = query.lte('sale_date', end_date)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: null, error }

  const rows = (data ?? []) as Sale[]

  const customerIds = Array.from(
    new Set(
      rows
        .map((row) => row.customer_id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  )

  const mechanicIds = Array.from(
    new Set(
      rows
        .map((row) => row.mechanic_id)
        .filter((id): id is string => Boolean(id)),
    ),
  )

  const customerMap = new Map<number, { name: string | null }>()
  const mechanicMap = new Map<string, { name: string | null }>()

  if (customerIds.length > 0) {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, name')
      .in('id', customerIds)

    for (const customer of customers ?? []) {
      customerMap.set(customer.id, { name: customer.name })
    }
  }

  if (mechanicIds.length > 0) {
    const { data: mechanics } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', mechanicIds)

    for (const mechanic of mechanics ?? []) {
      mechanicMap.set(mechanic.id, { name: mechanic.name })
    }
  }

  const enrichedRows = rows.map((row) => ({
    ...row,
    customer: row.customer_id ? customerMap.get(row.customer_id) ?? null : null,
    mechanic: mechanicMap.get(row.mechanic_id) ?? null,
  }))

  return {
    data: {
      data: enrichedRows as Sale[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    error: null,
  }
}

export async function getSaleById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: SaleWithDetails | null; error: Error | null }> {
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*, customer:customers(*), mechanic:profiles!sales_mechanic_id_fkey(*)')
    .eq('id', id)
    .single()

  if (saleError) return { data: null, error: saleError }

  const { data: details, error: detailsError } = await supabase
    .from('sale_details')
    .select('*, item:items(*)')
    .eq('sale_id', id)

  if (detailsError) return { data: null, error: detailsError }

  return {
    data: { ...sale, details: details ?? [] } as SaleWithDetails,
    error: null,
  }
}

export async function createSale(
  supabase: SupabaseClient,
  header: SaleInsert,
  details: Omit<SaleDetailInsert, 'sale_id'>[],
) {
  // 1. Validate stock availability
  for (const detail of details) {
    const { data: stockData } = await supabase
      .from('stock_movements')
      .select('type, quantity')
      .eq('item_id', detail.item_id)

    const currentStock = (stockData ?? []).reduce((acc, sm) => {
      return acc + (sm.type === 'IN' ? sm.quantity : -sm.quantity)
    }, 0)

    if (currentStock < detail.quantity) {
      return {
        data: null,
        error: new Error(
          `Insufficient stock for item ${detail.item_id}. Available: ${currentStock}, Requested: ${detail.quantity}`,
        ),
      }
    }
  }

  // 2. Insert sale header
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert(header)
    .select()
    .single<Sale>()

  if (saleError || !sale) return { data: null, error: saleError }

  // 3. Insert sale details
  const detailsWithId = details.map((d) => ({
    ...d,
    sale_id: sale.id,
  }))

  const { error: detailsError } = await supabase
    .from('sale_details')
    .insert(detailsWithId)

  if (detailsError) return { data: null, error: detailsError }

  // 4. Insert stock movements (OUT)
  const stockMovements: StockMovementInsert[] = details.map((d) => ({
    item_id: d.item_id,
    type: 'OUT' as const,
    quantity: d.quantity,
    reference_type: 'sale' as const,
    reference_id: sale.id,
  }))

  const { error: stockError } = await supabase
    .from('stock_movements')
    .insert(stockMovements)

  if (stockError) return { data: null, error: stockError }

  return { data: sale, error: null }
}

export async function updateSale(
  supabase: SupabaseClient,
  id: number,
  header: SaleUpdate,
) {
  return supabase
    .from('sales')
    .update({ ...header, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<Sale>()
}

export async function deleteSale(supabase: SupabaseClient, id: number) {
  // Reverse stock movements
  await supabase
    .from('stock_movements')
    .delete()
    .eq('reference_type', 'sale')
    .eq('reference_id', id)

  // Delete sale (details cascade)
  return supabase.from('sales').delete().eq('id', id)
}

export async function generateInvoiceNumber(
  supabase: SupabaseClient,
  prefix: string = 'INV',
) {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .ilike('invoice_number', `${prefix}-${year}-%`)

  const nextNum = (count ?? 0) + 1
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}
