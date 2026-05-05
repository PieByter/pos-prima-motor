import { db } from '@/lib/db'
import { sales, purchases, saleDetails } from '@/lib/db/schema'
import { eq, gte, lte, and } from 'drizzle-orm'
import type {
  SalesReport,
  PurchasesReport,
  ProfitLossReport,
  ReportDateRange,
} from '@/lib/types/database'

export async function getSalesReport(
  dateRange: ReportDateRange,
): Promise<{ data: SalesReport | null; error: Error | null }> {
  try {
    const rows = await db
      .select({ sale_date: sales.sale_date, total_amount: sales.total_amount })
      .from(sales)
      .where(
        and(
          eq(sales.status, 'completed'),
          gte(sales.sale_date, dateRange.start_date),
          lte(sales.sale_date, dateRange.end_date),
        ),
      )
      .orderBy(sales.sale_date)

    const total_sales = rows.reduce((sum, s) => sum + Number(s.total_amount), 0)

    const grouped: Record<string, { amount: number; count: number }> = {}
    for (const row of rows) {
      const date = row.sale_date
      if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
      grouped[date].amount += Number(row.total_amount)
      grouped[date].count += 1
    }

    return {
      data: {
        total_sales,
        total_transactions: rows.length,
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
  dateRange: ReportDateRange,
): Promise<{ data: PurchasesReport | null; error: Error | null }> {
  try {
    const rows = await db
      .select({ purchase_date: purchases.purchase_date, total_amount: purchases.total_amount })
      .from(purchases)
      .where(
        and(
          eq(purchases.status, 'completed'),
          gte(purchases.purchase_date, dateRange.start_date),
          lte(purchases.purchase_date, dateRange.end_date),
        ),
      )
      .orderBy(purchases.purchase_date)

    const total_purchases = rows.reduce((sum, p) => sum + Number(p.total_amount), 0)

    const grouped: Record<string, { amount: number; count: number }> = {}
    for (const row of rows) {
      const date = row.purchase_date
      if (!grouped[date]) grouped[date] = { amount: 0, count: 0 }
      grouped[date].amount += Number(row.total_amount)
      grouped[date].count += 1
    }

    return {
      data: {
        total_purchases,
        total_transactions: rows.length,
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
  dateRange: ReportDateRange,
): Promise<{ data: ProfitLossReport | null; error: Error | null }> {
  try {
    const [salesData, purchasesData, serviceData] = await Promise.all([
      db
        .select({ total_amount: sales.total_amount })
        .from(sales)
        .where(
          and(
            eq(sales.status, 'completed'),
            gte(sales.sale_date, dateRange.start_date),
            lte(sales.sale_date, dateRange.end_date),
          ),
        ),
      db
        .select({ total_amount: purchases.total_amount })
        .from(purchases)
        .where(
          and(
            eq(purchases.status, 'completed'),
            gte(purchases.purchase_date, dateRange.start_date),
            lte(purchases.purchase_date, dateRange.end_date),
          ),
        ),
      // service fees from sale_details joined with completed sales in range
      db
        .select({ service_fee: saleDetails.service_fee })
        .from(saleDetails)
        .innerJoin(
          sales,
          and(
            eq(saleDetails.sale_id, sales.id),
            eq(sales.status, 'completed'),
            gte(sales.sale_date, dateRange.start_date),
            lte(sales.sale_date, dateRange.end_date),
          ),
        ),
    ])

    const total_sales = salesData.reduce((sum, s) => sum + Number(s.total_amount), 0)
    const total_purchases = purchasesData.reduce((sum, p) => sum + Number(p.total_amount), 0)
    const total_service_fees = serviceData.reduce((sum, sd) => sum + Number(sd.service_fee), 0)

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
