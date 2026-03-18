import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  DashboardSummary,
  SalesChartData,
  TopSellingItem,
  LowStockAlert,
  Sale,
} from '@/lib/types/database'

export async function getSummaryCards(
  supabase: SupabaseClient,
  dateRange?: { start: string; end: string },
): Promise<{ data: DashboardSummary | null; error: Error | null }> {
  // Total sales in period
  let salesQuery = supabase
    .from('sales')
    .select('total_amount', { count: 'exact' })
    .eq('status', 'completed')

  if (dateRange) {
    salesQuery = salesQuery
      .gte('sale_date', dateRange.start)
      .lte('sale_date', dateRange.end)
  }

  const { data: salesData, count: salesCount } = await salesQuery

  const totalSales = (salesData ?? []).reduce(
    (sum: number, s: { total_amount: number }) => sum + s.total_amount,
    0,
  )

  // Total purchases in period
  let purchasesQuery = supabase
    .from('purchases')
    .select('total_amount')
    .eq('status', 'completed')

  if (dateRange) {
    purchasesQuery = purchasesQuery
      .gte('purchase_date', dateRange.start)
      .lte('purchase_date', dateRange.end)
  }

  const { data: purchasesData } = await purchasesQuery

  const totalPurchases = (purchasesData ?? []).reduce(
    (sum: number, p: { total_amount: number }) => sum + p.total_amount,
    0,
  )

  // Total items
  const { count: totalItems } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })

  // Total customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  return {
    data: {
      totalSales,
      totalPurchases,
      totalItems: totalItems ?? 0,
      totalCustomers: totalCustomers ?? 0,
      salesGrowth: 0, // Calculate by comparing periods
      purchasesGrowth: 0,
    },
    error: null,
  }
}

export async function getSalesChart(
  supabase: SupabaseClient,
  dateRange: { start: string; end: string },
): Promise<{ data: SalesChartData[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, total_amount')
    .eq('status', 'completed')
    .gte('sale_date', dateRange.start)
    .lte('sale_date', dateRange.end)
    .order('sale_date', { ascending: true })

  if (error) return { data: [], error: null }

  // Group by date
  const grouped: Record<string, { amount: number; count: number }> = {}
  for (const sale of data ?? []) {
    const date = sale.sale_date
    if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
    grouped[date].amount += sale.total_amount
    grouped[date].count += 1
  }

  const chartData: SalesChartData[] = Object.entries(grouped).map(
    ([date, { amount, count }]) => ({ date, amount, count }),
  )

  return { data: chartData, error: null }
}

export async function getTopSellingItems(
  supabase: SupabaseClient,
  limit: number = 5,
  dateRange?: { start: string; end: string },
): Promise<{ data: TopSellingItem[] | null; error: Error | null }> {
  // Fetch completed sale IDs first (handles optional date range safely)
  let salesQuery = supabase
    .from('sales')
    .select('id')
    .eq('status', 'completed')

  if (dateRange) {
    salesQuery = salesQuery
      .gte('sale_date', dateRange.start)
      .lte('sale_date', dateRange.end)
  }

  const { data: salesRows, error: salesErr } = await salesQuery
  if (salesErr) return { data: [], error: null }

  const saleIds = (salesRows ?? []).map((s: { id: number }) => s.id)
  if (saleIds.length === 0) return { data: [], error: null }

  const { data: detailRows, error: detailsErr } = await supabase
    .from('sale_details')
    .select('item_id, quantity, subtotal')
    .in('sale_id', saleIds)

  if (detailsErr) return { data: [], error: null }

  const itemIds = [...new Set((detailRows ?? []).map((d) => d.item_id))]
  const { data: itemRows } = await supabase
    .from('items')
    .select('id, name')
    .in('id', itemIds)

  const itemNameById = new Map<number, string>(
    (itemRows ?? []).map((i: { id: number; name: string }) => [i.id, i.name]),
  )

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
    aggregated[id].total_revenue += detail.subtotal
  }

  const sorted = Object.values(aggregated)
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, limit)

  return { data: sorted, error: null }
}

export async function getLowStockAlerts(
  supabase: SupabaseClient,
  threshold: number = 5,
): Promise<{ data: LowStockAlert[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('stock_summary')
    .select('item_id, name, sku, current_stock')
    .lte('current_stock', threshold)
    .order('current_stock', { ascending: true })
    .limit(10)

  if (error) return { data: null, error }
  return { data: data as LowStockAlert[], error: null }
}

export async function getRecentTransactions(
  supabase: SupabaseClient,
  limit: number = 5,
): Promise<{ data: Sale[] | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('sales')
    .select('*, customer:customers(name)')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { data: null, error }
  return { data: data as Sale[], error: null }
}
