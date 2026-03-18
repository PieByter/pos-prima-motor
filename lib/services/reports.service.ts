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
  const { data, error } = await supabase
    .from('sales')
    .select('sale_date, total_amount')
    .eq('status', 'completed')
    .gte('sale_date', dateRange.start_date)
    .lte('sale_date', dateRange.end_date)
    .order('sale_date', { ascending: true })

  if (error) return { data: null, error }

  const total_sales = (data ?? []).reduce(
    (sum: number, s: { total_amount: number }) => sum + s.total_amount,
    0,
  )

  // Group by date for daily breakdown
  const grouped: Record<string, { amount: number; count: number }> = {}
  for (const sale of data ?? []) {
    const date = sale.sale_date
    if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
    grouped[date].amount += sale.total_amount
    grouped[date].count += 1
  }

  return {
    data: {
      total_sales,
      total_transactions: (data ?? []).length,
      daily_breakdown: Object.entries(grouped).map(([date, vals]) => ({
        date,
        amount: vals.amount,
        count: vals.count,
      })),
    },
    error: null,
  }
}

export async function getPurchasesReport(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: PurchasesReport | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('purchases')
    .select('purchase_date, total_amount')
    .eq('status', 'completed')
    .gte('purchase_date', dateRange.start_date)
    .lte('purchase_date', dateRange.end_date)
    .order('purchase_date', { ascending: true })

  if (error) return { data: null, error }

  const total_purchases = (data ?? []).reduce(
    (sum: number, p: { total_amount: number }) => sum + p.total_amount,
    0,
  )

  // Group by date
  const grouped: Record<string, { amount: number; count: number }> = {}
  for (const purchase of data ?? []) {
    const date = purchase.purchase_date
    if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
    grouped[date].amount += purchase.total_amount
    grouped[date].count += 1
  }

  return {
    data: {
      total_purchases,
      total_transactions: (data ?? []).length,
      daily_breakdown: Object.entries(grouped).map(([date, vals]) => ({
        date,
        amount: vals.amount,
        count: vals.count,
      })),
    },
    error: null,
  }
}

export async function getProfitLossReport(
  supabase: SupabaseClient,
  dateRange: ReportDateRange,
): Promise<{ data: ProfitLossReport | null; error: Error | null }> {
  // Total sales
  const { data: salesData } = await supabase
    .from('sales')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('sale_date', dateRange.start_date)
    .lte('sale_date', dateRange.end_date)

  const total_sales = (salesData ?? []).reduce(
    (sum: number, s: { total_amount: number }) => sum + s.total_amount,
    0,
  )

  // Total purchases
  const { data: purchasesData } = await supabase
    .from('purchases')
    .select('total_amount')
    .eq('status', 'completed')
    .gte('purchase_date', dateRange.start_date)
    .lte('purchase_date', dateRange.end_date)

  const total_purchases = (purchasesData ?? []).reduce(
    (sum: number, p: { total_amount: number }) => sum + p.total_amount,
    0,
  )

  // Total service fees from sale_details
  const { data: serviceData } = await supabase
    .from('sale_details')
    .select('service_fee, sale:sales!inner(sale_date, status)')
    .eq('sale.status', 'completed')
    .gte('sale.sale_date', dateRange.start_date)
    .lte('sale.sale_date', dateRange.end_date)

  const total_service_fees = (serviceData ?? []).reduce(
    (sum: number, sd: { service_fee: number }) => sum + sd.service_fee,
    0,
  )

  const gross_profit = total_sales - total_purchases
  const net_profit = gross_profit + total_service_fees

  return {
    data: {
      total_sales,
      total_purchases,
      gross_profit,
      total_service_fees,
      net_profit,
    },
    error: null,
  }
}
