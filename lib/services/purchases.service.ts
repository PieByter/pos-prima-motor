import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Purchase,
  PurchaseInsert,
  PurchaseUpdate,
  PurchaseDetailInsert,
  PurchaseWithDetails,
  PaginatedResponse,
  StockMovementInsert,
} from '@/lib/types/database'

type PurchaseFilters = {
  search?: string
  supplier_id?: number
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

export async function getPurchases(
  supabase: SupabaseClient,
  filters: PurchaseFilters = {},
): Promise<{ data: PaginatedResponse<Purchase> | null; error: Error | null }> {
  const { search, supplier_id, status, start_date, end_date, page = 1, limit = 10 } = filters
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('purchases')
    .select('*', { count: 'exact' })

  if (search) {
    query = query.ilike('invoice_number', `%${search}%`)
  }
  if (supplier_id) {
    query = query.eq('supplier_id', supplier_id)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (start_date) {
    query = query.gte('purchase_date', start_date)
  }
  if (end_date) {
    query = query.lte('purchase_date', end_date)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return { data: null, error }

  const rows = (data ?? []) as Purchase[]

  const supplierIds = Array.from(
    new Set(
      rows
        .map((row) => row.supplier_id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  )

  const supplierMap = new Map<number, { name: string | null }>()

  if (supplierIds.length > 0) {
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('id, name')
      .in('id', supplierIds)

    for (const supplier of suppliers ?? []) {
      supplierMap.set(supplier.id, { name: supplier.name })
    }
  }

  const enrichedRows = rows.map((row) => ({
    ...row,
    supplier: supplierMap.get(row.supplier_id) ?? null,
  }))

  return {
    data: {
      data: enrichedRows as Purchase[],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
    error: null,
  }
}

export async function getPurchaseById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: PurchaseWithDetails | null; error: Error | null }> {
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .select('*, supplier:suppliers(*)')
    .eq('id', id)
    .single()

  if (purchaseError) return { data: null, error: purchaseError }

  const { data: details, error: detailsError } = await supabase
    .from('purchase_details')
    .select('*, item:items(*)')
    .eq('purchase_id', id)

  if (detailsError) return { data: null, error: detailsError }

  return {
    data: { ...purchase, details: details ?? [] } as PurchaseWithDetails,
    error: null,
  }
}

export async function createPurchase(
  supabase: SupabaseClient,
  header: PurchaseInsert,
  details: Omit<PurchaseDetailInsert, 'purchase_id'>[],
) {
  // 1. Insert purchase header
  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert(header)
    .select()
    .single<Purchase>()

  if (purchaseError || !purchase) return { data: null, error: purchaseError }

  // 2. Insert purchase details
  const detailsWithId = details.map((d) => ({
    ...d,
    purchase_id: purchase.id,
  }))

  const { error: detailsError } = await supabase
    .from('purchase_details')
    .insert(detailsWithId)

  if (detailsError) return { data: null, error: detailsError }

  // 3. Insert stock movements (IN)
  const stockMovements: StockMovementInsert[] = details.map((d) => ({
    item_id: d.item_id,
    type: 'IN' as const,
    quantity: d.quantity,
    reference_type: 'purchase' as const,
    reference_id: purchase.id,
  }))

  const { error: stockError } = await supabase
    .from('stock_movements')
    .insert(stockMovements)

  if (stockError) return { data: null, error: stockError }

  return { data: purchase, error: null }
}

export async function updatePurchase(
  supabase: SupabaseClient,
  id: number,
  header: PurchaseUpdate,
) {
  return supabase
    .from('purchases')
    .update({ ...header, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single<Purchase>()
}

export async function deletePurchase(supabase: SupabaseClient, id: number) {
  // Reverse stock movements first
  await supabase
    .from('stock_movements')
    .delete()
    .eq('reference_type', 'purchase')
    .eq('reference_id', id)

  // Delete purchase (details cascade)
  return supabase.from('purchases').delete().eq('id', id)
}

export async function generateInvoiceNumber(
  supabase: SupabaseClient,
  prefix: string = 'PO',
) {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .ilike('invoice_number', `${prefix}-${year}-%`)

  const nextNum = (count ?? 0) + 1
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}
