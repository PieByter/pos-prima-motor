import { db } from '@/lib/db'
import { stockMovements, stockSummary, items } from '@/lib/db/schema'
import { eq, lte, desc, sql } from 'drizzle-orm'
import type { StockSummary, StockMovement, LowStockAlert, PaginatedResponse } from '@/lib/types/database'

type StockFilters = {
  search?: string
  stock_status?: 'all' | 'low' | 'critical'
  page?: number
  limit?: number
}

export async function getStockSummary(
  filters: StockFilters = {},
): Promise<{ data: PaginatedResponse<StockSummary> | null; error: Error | null }> {
  try {
    const { search, stock_status, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const conditions = []
    if (search) {
      conditions.push(
        sql`(${stockSummary.name} ilike ${'%' + search + '%'} OR ${stockSummary.sku} ilike ${'%' + search + '%'})`,
      )
    }
    if (stock_status === 'low') conditions.push(lte(stockSummary.current_stock, 5))
    else if (stock_status === 'critical') conditions.push(lte(stockSummary.current_stock, 2))

    const where = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(stockSummary)
        .where(where)
        .orderBy(stockSummary.current_stock)
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(stockSummary)
        .where(where),
    ])

    return {
      data: {
        data: rows as StockSummary[],
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getStockMovements(
  itemId?: number,
  page: number = 1,
  limit: number = 20,
): Promise<{ data: PaginatedResponse<StockMovement & { item: { name: string; sku: string } }> | null; error: Error | null }> {
  try {
    const offset = (page - 1) * limit

    const where = itemId ? eq(stockMovements.item_id, itemId) : undefined

    const [rows, [{ count }]] = await Promise.all([
      db
        .select({
          movement: stockMovements,
          item: { name: items.name, sku: items.sku },
        })
        .from(stockMovements)
        .leftJoin(items, eq(stockMovements.item_id, items.id))
        .where(where)
        .orderBy(desc(stockMovements.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(stockMovements)
        .where(where),
    ])

    const data = rows.map((r) => ({
      ...r.movement,
      item: { name: r.item?.name ?? '', sku: r.item?.sku ?? '' },
      created_at: r.movement.created_at.toISOString(),
    }))

    return {
      data: {
        data: data as (StockMovement & { item: { name: string; sku: string } })[],
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function getLowStockItems(
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

    return { data: rows as LowStockAlert[], error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
