import { db } from '@/lib/db'
import { customers } from '@/lib/db/schema'
import { eq, ilike, or, desc, sql } from 'drizzle-orm'
import type {
  Customer,
  CustomerInsert,
  CustomerUpdate,
  PaginatedResponse,
} from '@/lib/types/database'

type DbCustomer = {
  id: number
  name: string
  phone: string | null
  address: string | null
  created_at: Date
  updated_at: Date
}

const mapCustomer = (row: DbCustomer): Customer => ({
  ...row,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

type CustomerFilters = {
  search?: string
  page?: number
  limit?: number
}

export async function getCustomers(
  filters: CustomerFilters = {},
): Promise<{ data: PaginatedResponse<Customer> | null; error: Error | null }> {
  try {
    const { search, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const where = search
      ? or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`))
      : undefined

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(customers)
        .where(where)
        .orderBy(desc(customers.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(customers)
        .where(where),
    ])

    return {
      data: {
        data: (rows as DbCustomer[]).map(mapCustomer),
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

export async function getCustomerById(
  id: number,
): Promise<{ data: Customer | null; error: Error | null }> {
  try {
    const [row] = await db.select().from(customers).where(eq(customers.id, id))
    if (!row) return { data: null, error: new Error('Customer not found') }
    return { data: mapCustomer(row as DbCustomer), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createCustomer(
  data: CustomerInsert,
): Promise<{ data: Customer | null; error: Error | null }> {
  try {
    const [row] = await db.insert(customers).values(data).returning()
    return { data: mapCustomer(row as DbCustomer), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updateCustomer(
  id: number,
  data: CustomerUpdate,
): Promise<{ data: Customer | null; error: Error | null }> {
  try {
    const [row] = await db
      .update(customers)
      .set({ ...data, updated_at: new Date() })
      .where(eq(customers.id, id))
      .returning()
    if (!row) return { data: null, error: new Error('Customer not found') }
    return { data: mapCustomer(row as DbCustomer), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deleteCustomer(id: number): Promise<{ error: Error | null }> {
  try {
    await db.delete(customers).where(eq(customers.id, id))
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}
