import { db } from '@/lib/db'
import { items } from '@/lib/db/schema'
import { eq, ilike, or, desc, sql } from 'drizzle-orm'
import type { Item, ItemInsert, ItemUpdate, PaginatedResponse } from '@/lib/types/database'
import { createAdminClient } from '@/lib/supabase/admin'

type ItemFilters = {
  search?: string
  category?: string
  page?: number
  limit?: number
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

const mapItem = (row: DbItem): Item => ({
  ...row,
  purchase_price: Number(row.purchase_price),
  selling_price: Number(row.selling_price),
  service_fee: Number(row.service_fee),
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

const toDbItemInsert = (data: ItemInsert) => ({
  ...data,
  purchase_price: data.purchase_price.toString(),
  selling_price: data.selling_price.toString(),
  service_fee: data.service_fee.toString(),
})

const toDbItemUpdate = (data: ItemUpdate) => ({
  ...data,
  purchase_price: data.purchase_price !== undefined ? data.purchase_price.toString() : undefined,
  selling_price: data.selling_price !== undefined ? data.selling_price.toString() : undefined,
  service_fee: data.service_fee !== undefined ? data.service_fee.toString() : undefined,
})

export async function getItems(
  filters: ItemFilters = {},
): Promise<{ data: PaginatedResponse<Item> | null; error: Error | null }> {
  try {
    const { search, category, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const conditions = []
    if (search) conditions.push(or(ilike(items.name, `%${search}%`), ilike(items.sku, `%${search}%`)))
    if (category) conditions.push(eq(items.category, category))

    const where = conditions.length === 1 ? conditions[0] : conditions.length > 1 ? sql`${conditions[0]} AND ${conditions[1]}` : undefined

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(items)
        .where(where)
        .orderBy(desc(items.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(items)
        .where(where),
    ])

    return {
      data: {
        data: (rows as DbItem[]).map(mapItem),
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

export async function getItemById(
  id: number,
): Promise<{ data: Item | null; error: Error | null }> {
  try {
    const [row] = await db.select().from(items).where(eq(items.id, id))
    if (!row) return { data: null, error: new Error('Item not found') }
    return { data: mapItem(row as DbItem), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createItem(
  data: ItemInsert,
): Promise<{ data: Item | null; error: Error | null }> {
  try {
    const [row] = await db.insert(items).values(toDbItemInsert(data)).returning()
    return { data: mapItem(row as DbItem), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updateItem(
  id: number,
  data: ItemUpdate,
): Promise<{ data: Item | null; error: Error | null }> {
  try {
    const [row] = await db
      .update(items)
      .set({ ...toDbItemUpdate(data), updated_at: new Date() })
      .where(eq(items.id, id))
      .returning()
    if (!row) return { data: null, error: new Error('Item not found') }
    return { data: mapItem(row as DbItem), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deleteItem(id: number): Promise<{ error: Error | null }> {
  try {
    await db.delete(items).where(eq(items.id, id))
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

// File upload uses Supabase Storage (not a DB operation)
export async function uploadItemPicture(file: File, fileName: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase.storage
    .from('item-pictures')
    .upload(`items/${fileName}`, file, { cacheControl: '3600', upsert: true })

  if (error) return { data: null, error }

  const {
    data: { publicUrl },
  } = supabase.storage.from('item-pictures').getPublicUrl(data.path)

  return { data: { path: data.path, publicUrl }, error: null }
}
