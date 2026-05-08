import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DashboardSummary,
  SalesChartData,
  TopSellingItem,
  LowStockAlert,
  Sale,
} from '@/lib/types/database'

type SaleWithCustomer = Sale & { customer?: { name: string | null } | null }

export async function getSummaryCards(
  supabase: SupabaseClient,
  dateRange?: { start: string; end: string },
): Promise<{ data: DashboardSummary | null; error: Error | null }> {
  try {
    // Sales totals
    let salesQuery = supabase
      .from('sales')
      .select('total_amount')
      .eq('status', 'completed')

    if (dateRange) {
      salesQuery = salesQuery.gte('sale_date', dateRange.start).lte('sale_date', dateRange.end)
    }
    const { data: salesData, error: salesError } = await salesQuery
    if (salesError) return { data: null, error: new Error(salesError.message) }

    // Purchases totals
    let purchasesQuery = supabase
      .from('purchases')
      .select('total_amount')
      .eq('status', 'completed')

    if (dateRange) {
      purchasesQuery = purchasesQuery.gte('purchase_date', dateRange.start).lte('purchase_date', dateRange.end)
    }
    const { data: purchasesData, error: purchasesError } = await purchasesQuery
    if (purchasesError) return { data: null, error: new Error(purchasesError.message) }

    // Total items count
    const { count: totalItems, error: itemsError } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
    if (itemsError) return { data: null, error: new Error(itemsError.message) }

    // Total customers count
    const { count: totalCustomers, error: customersError } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
    if (customersError) return { data: null, error: new Error(customersError.message) }

    const totalSales = (salesData ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)
    const totalPurchases = (purchasesData ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

    return {
      data: {
        totalSales,
        totalPurchases,
        totalItems: totalItems ?? 0,
        totalCustomers: totalCustomers ?? 0,
        salesGrowth: 0,
        purchasesGrowth: 0,
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getSalesChart(
  supabase: SupabaseClient,
  dateRange: { start: string; end: string },
): Promise<{ data: SalesChartData[] | null; error: Error | null }> {
  try {
    const { data: rows, error } = await supabase
      .from('sales')
      .select('sale_date, total_amount')
      .eq('status', 'completed')
      .gte('sale_date', dateRange.start)
      .lte('sale_date', dateRange.end)
      .order('sale_date', { ascending: true })

    if (error) return { data: [], error: new Error(error.message) }

    const grouped: Record<string, { amount: number; count: number }> = {}
    for (const row of rows ?? []) {
      const date = row.sale_date
      if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
      grouped[date].amount += Number(row.total_amount)
      grouped[date].count += 1
    }

    const chartData: SalesChartData[] = Object.entries(grouped).map(([date, { amount, count }]) => ({
      date,
      amount,
      count,
    }))

    return { data: chartData, error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

export async function getTopSellingItems(
  supabase: SupabaseClient,
  limit: number = 5,
  dateRange?: { start: string; end: string },
): Promise<{ data: TopSellingItem[] | null; error: Error | null }> {
  try {
    // Get completed sales in range
    let salesQuery = supabase
      .from('sales')
      .select('id')
      .eq('status', 'completed')

    if (dateRange) {
      salesQuery = salesQuery.gte('sale_date', dateRange.start).lte('sale_date', dateRange.end)
    }

    const { data: salesRows, error: salesError } = await salesQuery
    if (salesError) return { data: [], error: new Error(salesError.message) }

    const saleIds = (salesRows ?? []).map((s) => s.id)
    if (saleIds.length === 0) return { data: [], error: null }

    // Get sale details for those sales
    const { data: detailRows, error: detailError } = await supabase
      .from('sale_details')
      .select('item_id, quantity, subtotal')
      .in('sale_id', saleIds)

    if (detailError) return { data: [], error: new Error(detailError.message) }

    // Get item names
    const itemIds = [...new Set((detailRows ?? []).map((d) => d.item_id))]
    const { data: itemRows } = await supabase
      .from('items')
      .select('id, name')
      .in('id', itemIds)

    const itemNameById = new Map((itemRows ?? []).map((i) => [i.id, i.name]))

    // Aggregate
    const aggregated: Record<number, TopSellingItem> = {}
    for (const detail of detailRows ?? []) {
      const id = detail.item_id
      if (!aggregated[id]) {
        aggregated[id] = {
          item_id: id,
          name: itemNameById.get(id) ?? 'Unknown',
          total_sold: 0,
          total_revenue: 0,
        }
      }
      aggregated[id].total_sold += detail.quantity
      aggregated[id].total_revenue += Number(detail.subtotal)
    }

    const sorted = Object.values(aggregated)
      .sort((a, b) => b.total_sold - a.total_sold)
      .slice(0, limit)

    return { data: sorted, error: null }
  } catch (err) {
    return { data: [], error: err as Error }
  }
}

export async function getLowStockAlerts(
  supabase: SupabaseClient,
  threshold: number = 5,
): Promise<{ data: LowStockAlert[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('stock_summary')
      .select('item_id, name, sku, current_stock')
      .lte('current_stock', threshold)
      .order('current_stock', { ascending: true })
      .limit(10)

    if (error) return { data: null, error: new Error(error.message) }
    return { data: (data ?? []) as LowStockAlert[], error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getRecentTransactions(
  supabase: SupabaseClient,
  limitCount: number = 5,
): Promise<{ data: SaleWithCustomer[] | null; error: Error | null }> {
  try {
    const { data: rows, error } = await supabase
      .from('sales')
      .select('*, customers(name)')
      .order('created_at', { ascending: false })
      .limit(limitCount)

    if (error) return { data: null, error: new Error(error.message) }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapped: SaleWithCustomer[] = (rows ?? []).map((r: any) => ({
      ...r,
      total_amount: Number(r.total_amount),
      customer: r.customers ?? null,
      customers: undefined,
    }))

    return { data: mapped, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
