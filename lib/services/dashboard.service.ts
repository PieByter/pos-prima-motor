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

    // ── Calculate growth by comparing with previous period ─────────────
    let salesGrowth = 0
    let purchasesGrowth = 0

    if (dateRange) {
      const rangeStart = new Date(dateRange.start)
      const rangeEnd = new Date(dateRange.end)
      const rangeDuration = rangeEnd.getTime() - rangeStart.getTime()
      const prevEnd = new Date(rangeStart.getTime() - 1)
      const prevStart = new Date(prevEnd.getTime() - rangeDuration)

      const prevStartStr = prevStart.toISOString().slice(0, 10)
      const prevEndStr = prevEnd.toISOString().slice(0, 10)

      // Previous period sales
      const { data: prevSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('sale_date', prevStartStr)
        .lte('sale_date', prevEndStr)

      const prevSalesTotal = (prevSales ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)
      if (prevSalesTotal > 0) {
        salesGrowth = Math.round(((totalSales - prevSalesTotal) / prevSalesTotal) * 100)
      }

      // Previous period purchases
      const { data: prevPurchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('purchase_date', prevStartStr)
        .lte('purchase_date', prevEndStr)

      const prevPurchasesTotal = (prevPurchases ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)
      if (prevPurchasesTotal > 0) {
        purchasesGrowth = Math.round(((totalPurchases - prevPurchasesTotal) / prevPurchasesTotal) * 100)
      }
    } else {
      // Default: compare this month vs last month
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)

      // This month sales
      const { data: curSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('sale_date', currentMonthStart)

      const curSalesTotal = (curSales ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)

      // Last month sales
      const { data: prevSales } = await supabase
        .from('sales')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('sale_date', lastMonthStart)
        .lte('sale_date', lastMonthEnd)

      const prevSalesTotal = (prevSales ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)
      if (prevSalesTotal > 0) {
        salesGrowth = Math.round(((curSalesTotal - prevSalesTotal) / prevSalesTotal) * 100)
      }

      // This month purchases
      const { data: curPurchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('purchase_date', currentMonthStart)

      const curPurchasesTotal = (curPurchases ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

      // Last month purchases
      const { data: prevPurchases } = await supabase
        .from('purchases')
        .select('total_amount')
        .eq('status', 'completed')
        .gte('purchase_date', lastMonthStart)
        .lte('purchase_date', lastMonthEnd)

      const prevPurchasesTotal = (prevPurchases ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)
      if (prevPurchasesTotal > 0) {
        purchasesGrowth = Math.round(((curPurchasesTotal - prevPurchasesTotal) / prevPurchasesTotal) * 100)
      }
    }

    // ── Include expenses in summary if available ──────────────────────
    const { data: expenseRows } = dateRange
      ? await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', dateRange.start)
        .lte('expense_date', dateRange.end)
      : await supabase.from('expenses').select('amount')

    const totalExpenses = (expenseRows ?? []).reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      data: {
        totalSales,
        totalPurchases,
        totalItems: totalItems ?? 0,
        totalCustomers: totalCustomers ?? 0,
        totalExpenses,
        salesGrowth,
        purchasesGrowth,
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
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limitCount)

    if (error) return { data: null, error: new Error(error.message) }

    // Get customer names for sales that have a customer_id
    type SalesRow = Record<string, unknown> & { customer_id: number | null; total_amount: number | string }
    const salesRows = (rows ?? []) as unknown as SalesRow[]
    const customerIds = [...new Set(salesRows.map((r) => r.customer_id).filter((id): id is number => id !== null))]
    const customerMap: Record<number, string> = {}
    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name')
        .in('id', customerIds)
      for (const c of (customers ?? []) as unknown as { id: number; name: string }[]) {
        customerMap[c.id] = c.name
      }
    }

    const mapped: SaleWithCustomer[] = salesRows.map((r) => ({
      ...r,
      total_amount: Number(r.total_amount),
      customer: r.customer_id ? { name: customerMap[r.customer_id] ?? null } : null,
      customers: undefined,
    })) as unknown as SaleWithCustomer[]

    return { data: mapped, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
