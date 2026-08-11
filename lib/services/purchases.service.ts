import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Purchase,
  PurchaseInsert,
  PurchaseUpdate,
  PurchaseDetailInsert,
  PurchaseWithDetails,
  PaginatedResponse,
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

type SupabaseRow = Record<string, unknown>

function mapPurchase(row: SupabaseRow): Purchase {
  return {
    ...row,
    total_amount: Number(row.total_amount),
    paid_amount: row.paid_amount != null ? Number(row.paid_amount) : null,
    remaining_amount: row.remaining_amount != null ? Number(row.remaining_amount) : null,
  } as unknown as Purchase
}

export async function getPurchases(
  supabase: SupabaseClient,
  filters: PurchaseFilters = {},
): Promise<{ data: PaginatedResponse<Purchase> | null; error: Error | null }> {
  try {
    const { search, supplier_id, status, start_date, end_date, page = 1, limit = 10 } = filters
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('purchases')
      .select('*, suppliers(name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (search) query = query.ilike('invoice_number', `%${search}%`)
    if (supplier_id) query = query.eq('supplier_id', supplier_id)
    if (status) query = query.eq('status', status)
    if (start_date) query = query.gte('purchase_date', start_date)
    if (end_date) query = query.lte('purchase_date', end_date)

    const { data, error, count } = await query
    if (error) return { data: null, error: new Error(error.message) }

    const enriched = (data ?? []).map((r) => ({
      ...mapPurchase(r),
      supplier: r.suppliers ?? null,
      suppliers: undefined,
    }))

    return {
      data: {
        data: enriched as Purchase[],
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

export async function getPurchaseById(
  supabase: SupabaseClient,
  id: number,
): Promise<{ data: PurchaseWithDetails | null; error: Error | null }> {
  try {
    const { data: purchase, error } = await supabase
      .from('purchases')
      .select('*, suppliers(*)')
      .eq('id', id)
      .single()

    if (error || !purchase) return { data: null, error: new Error('Purchase not found') }

    const { data: detailRows } = await supabase
      .from('purchase_details')
      .select('*')
      .eq('purchase_id', id)

    const details = (detailRows ?? []).map((d) => ({
      ...d,
      price: Number(d.price),
      subtotal: Number(d.subtotal),
    }))

    return {
      data: {
        ...mapPurchase(purchase),
        supplier: purchase.suppliers ?? undefined,
        details,
      } as unknown as PurchaseWithDetails,
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createPurchase(
  supabase: SupabaseClient,
  header: PurchaseInsert,
  details: Omit<PurchaseDetailInsert, 'purchase_id'>[],
): Promise<{ data: Purchase | null; error: Error | null }> {
  try {
    // 1. Insert purchase header
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert(header)
      .select()
      .single()

    if (purchaseError || !purchase) {
      return { data: null, error: new Error(purchaseError?.message ?? 'Failed to create purchase') }
    }

    // 2. Insert purchase details
    const detailsWithId = details.map((d) => ({ ...d, purchase_id: purchase.id }))
    const { error: detailsError } = await supabase.from('purchase_details').insert(detailsWithId)

    if (detailsError) {
      await supabase.from('purchases').delete().eq('id', purchase.id)
      return { data: null, error: new Error(detailsError.message) }
    }

    // 3. Insert stock movements (IN)
    const stockMovs = details.map((d) => ({
      item_id: d.item_id,
      type: 'IN' as const,
      quantity: d.quantity,
      reference_type: 'purchase' as const,
      reference_id: purchase.id,
    }))
    const { error: stockError } = await supabase.from('stock_movements').insert(stockMovs)

    if (stockError) {
      await supabase.from('purchase_details').delete().eq('purchase_id', purchase.id)
      await supabase.from('purchases').delete().eq('id', purchase.id)
      return { data: null, error: new Error(stockError.message) }
    }

    return { data: mapPurchase(purchase), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updatePurchase(
  supabase: SupabaseClient,
  id: number,
  header: PurchaseUpdate,
  details?: Omit<PurchaseDetailInsert, 'purchase_id'>[],
): Promise<{ data: Purchase | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('purchases')
      .update({ ...header, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !row) return { data: null, error: new Error('Purchase not found') }

    // Jika details dikirim → replace seluruh detail + stock movement (hindari duplikat)
    if (details) {
      await supabase.from('stock_movements').delete().eq('reference_type', 'purchase').eq('reference_id', id)
      await supabase.from('purchase_details').delete().eq('purchase_id', id)

      const detailsWithId = details.map((d) => ({ ...d, purchase_id: id }))
      const { error: detailsError } = await supabase.from('purchase_details').insert(detailsWithId)
      if (detailsError) return { data: null, error: new Error(detailsError.message) }

      const stockMovs = details.map((d) => ({
        item_id: d.item_id,
        type: 'IN' as const,
        quantity: d.quantity,
        reference_type: 'purchase' as const,
        reference_id: id,
      }))
      const { error: stockError } = await supabase.from('stock_movements').insert(stockMovs)
      if (stockError) return { data: null, error: new Error(stockError.message) }
    }

    return { data: mapPurchase(row), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deletePurchase(
  supabase: SupabaseClient,
  id: number,
): Promise<{ error: Error | null }> {
  try {
    await supabase.from('stock_movements').delete().eq('reference_type', 'purchase').eq('reference_id', id)
    await supabase.from('purchase_details').delete().eq('purchase_id', id)
    const { error } = await supabase.from('purchases').delete().eq('id', id)
    return { error: error ? new Error(error.message) : null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function generateInvoiceNumber(
  supabase: SupabaseClient,
  prefix: string = 'PO',
): Promise<string> {
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('purchases')
    .select('*', { count: 'exact', head: true })
    .ilike('invoice_number', `${prefix}-${year}-%`)

  const nextNum = (count ?? 0) + 1
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}
