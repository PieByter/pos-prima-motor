import { db } from '@/lib/db'
import { sales, purchases, items, customers, saleDetails, stockSummary } from '@/lib/db/schema'
import { eq, gte, lte, desc, sql, inArray, and } from 'drizzle-orm'
import type {
  DashboardSummary,
  SalesChartData,
  TopSellingItem,
  LowStockAlert,
  Sale,
} from '@/lib/types/database'

type DbSale = {
  id: number
  customer_id: number | null
  mechanic_id: string
  invoice_number: string
  sale_date: Date | string
  total_amount: string
  status: Sale['status']
  created_by: string
  created_at: Date
  updated_at: Date
}

type SaleWithCustomer = Sale & { customer?: { name: string | null } | null }

const mapSale = (row: DbSale): Sale => ({
  ...row,
  sale_date: row.sale_date instanceof Date ? row.sale_date.toISOString().split('T')[0] : row.sale_date,
  total_amount: Number(row.total_amount),
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

export async function getSummaryCards(
  dateRange?: { start: string; end: string },
): Promise<{ data: DashboardSummary | null; error: Error | null }> {
  try {
    const salesConditions = [eq(sales.status, 'completed')]
    const purchasesConditions = [eq(purchases.status, 'completed')]
    if (dateRange) {
      salesConditions.push(gte(sales.sale_date, dateRange.start))
      salesConditions.push(lte(sales.sale_date, dateRange.end))
      purchasesConditions.push(gte(purchases.purchase_date, dateRange.start))
      purchasesConditions.push(lte(purchases.purchase_date, dateRange.end))
    }

    const [salesData, purchasesData, [{ totalItems }], [{ totalCustomers }]] = await Promise.all([
      db
        .select({ total_amount: sales.total_amount })
        .from(sales)
        .where(and(...salesConditions)),
      db
        .select({ total_amount: purchases.total_amount })
        .from(purchases)
        .where(and(...purchasesConditions)),
      db.select({ totalItems: sql<number>`count(*)::int` }).from(items),
      db.select({ totalCustomers: sql<number>`count(*)::int` }).from(customers),
    ])

    const totalSales = salesData.reduce((sum, s) => sum + Number(s.total_amount), 0)
    const totalPurchases = purchasesData.reduce((sum, p) => sum + Number(p.total_amount), 0)

    return {
      data: {
        totalSales,
        totalPurchases,
        totalItems,
        totalCustomers,
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
  dateRange: { start: string; end: string },
): Promise<{ data: SalesChartData[] | null; error: Error | null }> {
  try {
    const rows = await db
      .select({ sale_date: sales.sale_date, total_amount: sales.total_amount })
      .from(sales)
      .where(
        and(
          eq(sales.status, 'completed'),
          gte(sales.sale_date, dateRange.start),
          lte(sales.sale_date, dateRange.end),
        ),
      )
      .orderBy(sales.sale_date)

    const grouped: Record<string, { amount: number; count: number }> = {}
    for (const row of rows) {
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
  limit: number = 5,
  dateRange?: { start: string; end: string },
): Promise<{ data: TopSellingItem[] | null; error: Error | null }> {
  try {
    const salesConditions = [eq(sales.status, 'completed')]
    if (dateRange) {
      salesConditions.push(gte(sales.sale_date, dateRange.start))
      salesConditions.push(lte(sales.sale_date, dateRange.end))
    }

    const saleIds = (
      await db.select({ id: sales.id }).from(sales).where(and(...salesConditions))
    ).map((s) => s.id)

    if (saleIds.length === 0) return { data: [], error: null }

    const detailRows = await db
      .select({
        item_id: saleDetails.item_id,
        quantity: saleDetails.quantity,
        subtotal: saleDetails.subtotal,
      })
      .from(saleDetails)
      .where(inArray(saleDetails.sale_id, saleIds))

    const itemIds = [...new Set(detailRows.map((d) => d.item_id))]
    const itemRows = await db
      .select({ id: items.id, name: items.name })
      .from(items)
      .where(inArray(items.id, itemIds))

    const itemNameById = new Map(itemRows.map((i) => [i.id, i.name]))

    const aggregated: Record<number, TopSellingItem> = {}
    for (const detail of detailRows) {
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
  threshold: number = 5,
): Promise<{ data: LowStockAlert[] | null; error: Error | null }> {
  try {
    const rows = await db
      .select({
        item_id: stockSummary.item_id,
        name: stockSummary.name,
        sku: stockSummary.sku,
        current_stock: stockSummary.current_stock,
      })
      .from(stockSummary)
      .where(lte(stockSummary.current_stock, threshold))
      .orderBy(stockSummary.current_stock)
      .limit(10)

    return { data: rows as LowStockAlert[], error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getRecentTransactions(
  limitCount: number = 5,
): Promise<{ data: SaleWithCustomer[] | null; error: Error | null }> {
  try {
    const rows = await db
      .select({
        sale: sales,
        customer: { name: customers.name },
      })
      .from(sales)
      .leftJoin(customers, eq(sales.customer_id, customers.id))
      .orderBy(desc(sales.created_at))
      .limit(limitCount)

    const data: SaleWithCustomer[] = rows.map((r) => ({
      ...mapSale(r.sale as DbSale),
      customer: r.customer ?? null,
    }))
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
