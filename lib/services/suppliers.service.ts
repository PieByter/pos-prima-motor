import { db } from '@/lib/db'
import { suppliers } from '@/lib/db/schema'
import { eq, ilike, or, desc, sql } from 'drizzle-orm'
import type {
  Supplier,
  SupplierInsert,
  SupplierUpdate,
  PaginatedResponse,
} from '@/lib/types/database'

type DbSupplier = {
  id: number
  name: string
  phone: string | null
  address: string | null
  created_at: Date
  updated_at: Date
}

const mapSupplier = (row: DbSupplier): Supplier => ({
  ...row,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

type SupplierFilters = {
  search?: string
  page?: number
  limit?: number
}

export async function getSuppliers(
  filters: SupplierFilters = {},
): Promise<{ data: PaginatedResponse<Supplier> | null; error: Error | null }> {
  try {
    const { search, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const where = search
      ? or(ilike(suppliers.name, `%${search}%`), ilike(suppliers.phone, `%${search}%`))
      : undefined

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(suppliers)
        .where(where)
        .orderBy(desc(suppliers.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(suppliers)
        .where(where),
    ])

    return {
      data: {
        data: (rows as DbSupplier[]).map(mapSupplier),
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

export async function getSupplierById(
  id: number,
): Promise<{ data: Supplier | null; error: Error | null }> {
  try {
    const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id))
    if (!row) return { data: null, error: new Error('Supplier not found') }
    return { data: mapSupplier(row as DbSupplier), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createSupplier(
  data: SupplierInsert,
): Promise<{ data: Supplier | null; error: Error | null }> {
  try {
    const [row] = await db.insert(suppliers).values(data).returning()
    return { data: mapSupplier(row as DbSupplier), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updateSupplier(
  id: number,
  data: SupplierUpdate,
): Promise<{ data: Supplier | null; error: Error | null }> {
  try {
    const [row] = await db
      .update(suppliers)
      .set({ ...data, updated_at: new Date() })
      .where(eq(suppliers.id, id))
      .returning()
    if (!row) return { data: null, error: new Error('Supplier not found') }
    return { data: mapSupplier(row as DbSupplier), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deleteSupplier(id: number): Promise<{ error: Error | null }> {
  try {
    await db.delete(suppliers).where(eq(suppliers.id, id))
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}
