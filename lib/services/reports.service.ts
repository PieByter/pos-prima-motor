import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SalesReport,
  PurchasesReport,
  ProfitLossReport,
  ReportDateRange,
} from '@/lib/types/database'

export async function getSalesReport(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: SalesReport | null; error: Error | null }> {
  try {
    const { data: rows, error } = await supabase
      .from('sales')
      .select('sale_date, total_amount')
      .eq('status', 'completed')
      .gte('sale_date', dateRange.start_date)
      .lte('sale_date', dateRange.end_date)
      .order('sale_date', { ascending: true })

    if (error) return { data: null, error: new Error(error.message) }

    const total_sales = (rows ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)

    const grouped: Record<string, { amount: number; count: number }> = {}
    for (const row of rows ?? []) {
      const date = row.sale_date
      if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
      grouped[date].amount += Number(row.total_amount)
      grouped[date].count += 1
    }

    return {
      data: {
        total_sales,
        total_transactions: (rows ?? []).length,
        daily_breakdown: Object.entries(grouped).map(([date, vals]) => ({
          date,
          amount: vals.amount,
          count: vals.count,
        })),
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getPurchasesReport(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: PurchasesReport | null; error: Error | null }> {
  try {
    const { data: rows, error } = await supabase
      .from('purchases')
      .select('purchase_date, total_amount')
      .eq('status', 'completed')
      .gte('purchase_date', dateRange.start_date)
      .lte('purchase_date', dateRange.end_date)
      .order('purchase_date', { ascending: true })

    if (error) return { data: null, error: new Error(error.message) }

    const total_purchases = (rows ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

    const grouped: Record<string, { amount: number; count: number }> = {}
    for (const row of rows ?? []) {
      const date = row.purchase_date
      if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
      grouped[date].amount += Number(row.total_amount)
      grouped[date].count += 1
    }

    return {
      data: {
        total_purchases,
        total_transactions: (rows ?? []).length,
        daily_breakdown: Object.entries(grouped).map(([date, vals]) => ({
          date,
          amount: vals.amount,
          count: vals.count,
        })),
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getProfitLossReport(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: ProfitLossReport | null; error: Error | null }> {
  try {
    // Get completed sales in range
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('id, total_amount')
      .eq('status', 'completed')
      .gte('sale_date', dateRange.start_date)
      .lte('sale_date', dateRange.end_date)

    if (salesError) return { data: null, error: new Error(salesError.message) }

    // Get completed purchases in range
    const { data: purchasesData, error: purchasesError } = await supabase
      .from('purchases')
      .select('total_amount')
      .eq('status', 'completed')
      .gte('purchase_date', dateRange.start_date)
      .lte('purchase_date', dateRange.end_date)

    if (purchasesError) return { data: null, error: new Error(purchasesError.message) }

    const saleIds = (salesData ?? []).map((s) => s.id)
    let total_service_fees = 0
    let hpp_total = 0

    if (saleIds.length > 0) {
      const { data: detailData, error: detailError } = await supabase
        .from('sale_details')
        .select('item_id, quantity, service_fee')
        .in('sale_id', saleIds)

      if (detailError) return { data: null, error: new Error(detailError.message) }

      total_service_fees = (detailData ?? []).reduce((sum, sd) => sum + Number(sd.service_fee), 0)

      // HPP: get purchase_price from items for each sold item
      const itemIds = [...new Set((detailData ?? []).map((d) => d.item_id))]
      if (itemIds.length > 0) {
        const { data: items } = await supabase
          .from('items')
          .select('id, purchase_price')
          .in('id', itemIds)

        const priceMap = new Map((items ?? []).map((i) => [i.id, Number(i.purchase_price)]))

        hpp_total = (detailData ?? []).reduce((sum, sd) => {
          const purchasePrice = priceMap.get(sd.item_id) ?? 0
          return sum + purchasePrice * sd.quantity
        }, 0)
      }
    }

    const total_sales = (salesData ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)
    const total_purchases = (purchasesData ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

    const gross_profit = total_sales - hpp_total
    const net_profit = gross_profit + total_service_fees

    return {
      data: { total_sales, total_purchases, gross_profit, total_service_fees, net_profit, hpp_total },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
