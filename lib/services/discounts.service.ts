import { db } from '@/lib/db'
import { discounts, discountItems, items } from '@/lib/db/schema'
import { eq, ilike, lte, isNull, or, and, desc, sql, inArray } from 'drizzle-orm'
import type {
  Discount,
  DiscountInsert,
  DiscountUpdate,
  DiscountWithItems,
  Item,
  PaginatedResponse,
} from '@/lib/types/database'

type DiscountFilters = {
  search?: string
  is_active?: boolean
  page?: number
  limit?: number
}

type DbDiscount = {
  id: number
  name: string
  type: Discount['type']
  value: string
  min_transaction: string
  max_percent: string | null
  is_active: boolean
  start_date: Date | string | null
  end_date: Date | string | null
}

type DbItem = {
  id: number
  name: string
  description: string | null
  sku: string | null
  category: string | null
  purchase_price: string
  selling_price: string
  service_fee: string
  picture: string | null
  created_at: Date
  updated_at: Date
}

const mapDiscount = (row: DbDiscount): Discount => ({
  ...row,
  value: Number(row.value),
  min_transaction: Number(row.min_transaction),
  max_percent: row.max_percent !== null ? Number(row.max_percent) : null,
  start_date: row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0] : row.start_date,
  end_date: row.end_date instanceof Date ? row.end_date.toISOString().split('T')[0] : row.end_date,
})

const mapItem = (row: DbItem): Item => ({
  ...row,
  purchase_price: Number(row.purchase_price),
  selling_price: Number(row.selling_price),
  service_fee: Number(row.service_fee),
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

const toDbDiscountInsert = (data: DiscountInsert) => ({
  ...data,
  value: data.value.toString(),
  min_transaction: data.min_transaction.toString(),
  max_percent: data.max_percent !== null && data.max_percent !== undefined ? data.max_percent.toString() : null,
})

const toDbDiscountUpdate = (data: DiscountUpdate) => ({
  ...data,
  value: data.value !== undefined ? data.value.toString() : undefined,
  min_transaction: data.min_transaction !== undefined ? data.min_transaction.toString() : undefined,
  max_percent:
    data.max_percent === undefined
      ? undefined
      : data.max_percent === null
        ? null
        : data.max_percent.toString(),
})

export async function getDiscounts(
  filters: DiscountFilters = {},
): Promise<{ data: PaginatedResponse<Discount> | null; error: Error | null }> {
  try {
    const { search, is_active, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const conditions = []
    if (search) conditions.push(ilike(discounts.name, `%${search}%`))
    if (is_active !== undefined) conditions.push(eq(discounts.is_active, is_active))

    const where = conditions.length === 0 ? undefined : conditions.length === 1 ? conditions[0] : and(...conditions)

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(discounts)
        .where(where)
        .orderBy(desc(discounts.id))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(discounts)
        .where(where),
    ])

    return {
      data: {
        data: (rows as DbDiscount[]).map(mapDiscount),
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

export async function getDiscountById(
  id: number,
): Promise<{ data: DiscountWithItems | null; error: Error | null }> {
  try {
    const [discount] = await db.select().from(discounts).where(eq(discounts.id, id))
    if (!discount) return { data: null, error: new Error('Discount not found') }

    // Get linked item ids
    const linkedItems = await db
      .select({ item: items })
      .from(discountItems)
      .innerJoin(items, eq(discountItems.item_id, items.id))
      .where(eq(discountItems.discount_id, id))

    return {
      data: {
        ...mapDiscount(discount as DbDiscount),
        items: linkedItems.map((r) => mapItem(r.item as DbItem)),
      } as DiscountWithItems,
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createDiscount(
  data: DiscountInsert,
  itemIds: number[] = [],
): Promise<{ data: Discount | null; error: Error | null }> {
  try {
    const [discount] = await db.insert(discounts).values(toDbDiscountInsert(data)).returning()

    if (itemIds.length > 0) {
      await db
        .insert(discountItems)
        .values(itemIds.map((item_id) => ({ discount_id: discount.id, item_id })))
    }

    return { data: mapDiscount(discount as DbDiscount), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updateDiscount(
  id: number,
  data: DiscountUpdate,
  itemIds?: number[],
): Promise<{ data: Discount | null; error: Error | null }> {
  try {
    const [discount] = await db
      .update(discounts)
      .set(toDbDiscountUpdate(data))
      .where(eq(discounts.id, id))
      .returning()

    if (!discount) return { data: null, error: new Error('Discount not found') }

    if (itemIds !== undefined) {
      await db.delete(discountItems).where(eq(discountItems.discount_id, id))
      if (itemIds.length > 0) {
        await db
          .insert(discountItems)
          .values(itemIds.map((item_id) => ({ discount_id: id, item_id })))
      }
    }

    return { data: mapDiscount(discount as DbDiscount), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deleteDiscount(id: number): Promise<{ error: Error | null }> {
  try {
    // discount_items cascade or delete manually
    await db.delete(discountItems).where(eq(discountItems.discount_id, id))
    await db.delete(discounts).where(eq(discounts.id, id))
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function getApplicableDiscounts(
  itemIds: number[],
  totalAmount: number,
): Promise<{ data: (Discount & { discount_items: { item_id: number }[] })[] | null; error: Error | null }> {
  try {
    const now = new Date().toISOString().split('T')[0]

    const rows = await db
      .select()
      .from(discounts)
      .where(
        and(
          eq(discounts.is_active, true),
          lte(discounts.min_transaction, String(totalAmount)),
          or(isNull(discounts.start_date), lte(discounts.start_date, now)),
          or(isNull(discounts.end_date), sql`${discounts.end_date} >= ${now}`),
        ),
      )

    if (rows.length === 0) return { data: [], error: null }

    const discountIds = rows.map((d) => d.id)
    const links = await db
      .select()
      .from(discountItems)
      .where(inArray(discountItems.discount_id, discountIds))

    // Group links by discount_id
    const linkMap = new Map<number, { item_id: number }[]>()
    for (const link of links) {
      const arr = linkMap.get(link.discount_id) ?? []
      arr.push({ item_id: link.item_id })
      linkMap.set(link.discount_id, arr)
    }

    const applicable = rows
      .map((d) => ({ ...mapDiscount(d as DbDiscount), discount_items: linkMap.get(d.id) ?? [] }))
      .filter((d) => {
        if (d.discount_items.length === 0) return true
        return d.discount_items.some((di) => itemIds.includes(di.item_id))
      })

    return { data: applicable as (Discount & { discount_items: { item_id: number }[] })[], error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}
