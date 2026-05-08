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

    // Get service fees from sale_details for those sales
    const saleIds = (salesData ?? []).map((s) => s.id)
    let total_service_fees = 0

    if (saleIds.length > 0) {
      const { data: serviceData, error: serviceError } = await supabase
        .from('sale_details')
        .select('service_fee')
        .in('sale_id', saleIds)

      if (serviceError) return { data: null, error: new Error(serviceError.message) }
      total_service_fees = (serviceData ?? []).reduce((sum, sd) => sum + Number(sd.service_fee), 0)
    }

    const total_sales = (salesData ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)
    const total_purchases = (purchasesData ?? []).reduce((sum, p) => sum + Number(p.total_amount), 0)

    const gross_profit = total_sales - total_purchases
    const net_profit = gross_profit + total_service_fees

    return {
      data: { total_sales, total_purchases, gross_profit, total_service_fees, net_profit },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
