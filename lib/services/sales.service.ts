import { db } from '@/lib/db'
import { sales, saleDetails, customers, profiles, stockMovements, items } from '@/lib/db/schema'
import { eq, ilike, desc, sql, and, gte, lte, inArray } from 'drizzle-orm'
import type {
  Sale,
  SaleInsert,
  SaleUpdate,
  SaleDetailInsert,
  SaleWithDetails,
  PaginatedResponse,
} from '@/lib/types/database'

type SaleFilters = {
  search?: string
  customer_id?: number
  mechanic_id?: string
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

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

type DbSaleDetail = {
  id: number
  sale_id: number
  item_id: number
  quantity: number
  base_price: string
  discount_amount: string
  final_price: string
  service_fee: string
  subtotal: string
}

type DbCustomer = {
  id: number
  name: string
  phone: string | null
  address: string | null
  created_at: Date
  updated_at: Date
}

type DbProfile = {
  id: string
  name: string
  role: 'admin' | 'mekanik'
  is_active: boolean
  profile_picture: string | null
  created_at: Date
  updated_at: Date
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

type SaleListItem = Sale & {
  customer?: { name: string | null } | null
  mechanic?: { name: string | null } | null
}

const mapSale = (row: DbSale): Sale => ({
  ...row,
  sale_date: row.sale_date instanceof Date ? row.sale_date.toISOString().split('T')[0] : row.sale_date,
  total_amount: Number(row.total_amount),
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

const mapSaleDetail = (row: DbSaleDetail): SaleDetailInsert & { id: number; sale_id: number } => ({
  ...row,
  base_price: Number(row.base_price),
  discount_amount: Number(row.discount_amount),
  final_price: Number(row.final_price),
  service_fee: Number(row.service_fee),
  subtotal: Number(row.subtotal),
})

const mapCustomer = (row: DbCustomer) => ({
  ...row,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

const mapProfile = (row: DbProfile) => ({
  ...row,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

const mapItem = (row: DbItem) => ({
  ...row,
  purchase_price: Number(row.purchase_price),
  selling_price: Number(row.selling_price),
  service_fee: Number(row.service_fee),
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

const toDbSaleInsert = (header: SaleInsert) => ({
  ...header,
  total_amount: header.total_amount.toString(),
})

const toDbSaleUpdate = (header: SaleUpdate) => ({
  ...header,
  total_amount: header.total_amount !== undefined ? header.total_amount.toString() : undefined,
})

const toDbSaleDetailInsert = (detail: Omit<SaleDetailInsert, 'sale_id'> & { sale_id: number }) => ({
  ...detail,
  base_price: detail.base_price.toString(),
  discount_amount: detail.discount_amount.toString(),
  final_price: detail.final_price.toString(),
  service_fee: detail.service_fee.toString(),
  subtotal: detail.subtotal.toString(),
})

export async function getSales(
  filters: SaleFilters = {},
): Promise<{ data: PaginatedResponse<Sale> | null; error: Error | null }> {
  try {
    const { search, customer_id, mechanic_id, status, start_date, end_date, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const conditions = []
    if (search) conditions.push(ilike(sales.invoice_number, `%${search}%`))
    if (customer_id) conditions.push(eq(sales.customer_id, customer_id))
    if (mechanic_id) conditions.push(eq(sales.mechanic_id, mechanic_id))
    if (status) conditions.push(eq(sales.status, status as Sale['status']))
    if (start_date) conditions.push(gte(sales.sale_date, start_date))
    if (end_date) conditions.push(lte(sales.sale_date, end_date))

    const where = conditions.length === 0 ? undefined : and(...conditions)

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(sales)
        .where(where)
        .orderBy(desc(sales.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(sales)
        .where(where),
    ])

    // Enrich with customer and mechanic names
    const mappedRows = (rows as DbSale[]).map(mapSale)
    const customerIds = [...new Set(mappedRows.map((r) => r.customer_id).filter((id): id is number => id !== null))]
    const mechanicIds = [...new Set(mappedRows.map((r) => r.mechanic_id).filter(Boolean))]

    const customerMap = new Map<number, { name: string | null }>()
    const mechanicMap = new Map<string, { name: string | null }>()

    if (customerIds.length > 0) {
      const cRows = await db
        .select({ id: customers.id, name: customers.name })
        .from(customers)
        .where(inArray(customers.id, customerIds))
      for (const c of cRows) customerMap.set(c.id, { name: c.name })
    }

    if (mechanicIds.length > 0) {
      const mRows = await db
        .select({ id: profiles.id, name: profiles.name })
        .from(profiles)
        .where(inArray(profiles.id, mechanicIds))
      for (const m of mRows) mechanicMap.set(m.id, { name: m.name })
    }

    const enriched: SaleListItem[] = mappedRows.map((r) => ({
      ...r,
      customer: r.customer_id ? customerMap.get(r.customer_id) ?? null : null,
      mechanic: mechanicMap.get(r.mechanic_id) ?? null,
    }))

    return {
      data: {
        data: enriched,
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

export async function getSaleById(
  id: number,
): Promise<{ data: SaleWithDetails | null; error: Error | null }> {
  try {
    const [sale] = await db.select().from(sales).where(eq(sales.id, id))
    if (!sale) return { data: null, error: new Error('Sale not found') }

    const [customer] = sale.customer_id
      ? await db.select().from(customers).where(eq(customers.id, sale.customer_id))
      : [undefined]

    const [mechanic] = await db.select().from(profiles).where(eq(profiles.id, sale.mechanic_id))

    const detailRows = await db
      .select({
        detail: saleDetails,
        item: items,
      })
      .from(saleDetails)
      .leftJoin(items, eq(saleDetails.item_id, items.id))
      .where(eq(saleDetails.sale_id, id))

    return {
      data: {
        ...mapSale(sale as DbSale),
        customer: customer ? mapCustomer(customer as DbCustomer) : null,
        mechanic: mechanic ? mapProfile(mechanic as DbProfile) : undefined,
        details: detailRows.map((r) => ({
          ...mapSaleDetail(r.detail as DbSaleDetail),
          item: r.item ? mapItem(r.item as DbItem) : undefined,
        })),
      } as SaleWithDetails,
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createSale(
  header: SaleInsert,
  details: Omit<SaleDetailInsert, 'sale_id'>[],
): Promise<{ data: Sale | null; error: Error | null }> {
  try {
    // 1. Validate stock
    for (const detail of details) {
      const stockRows = await db
        .select({ type: stockMovements.type, quantity: stockMovements.quantity })
        .from(stockMovements)
        .where(eq(stockMovements.item_id, detail.item_id))

      const currentStock = stockRows.reduce(
        (acc, sm) => acc + (sm.type === 'IN' ? sm.quantity : -sm.quantity),
        0,
      )

      if (currentStock < detail.quantity) {
        return {
          data: null,
          error: new Error(
            `Insufficient stock for item ${detail.item_id}. Available: ${currentStock}, Requested: ${detail.quantity}`,
          ),
        }
      }
    }

    return await db.transaction(async (tx) => {
      const [sale] = await tx.insert(sales).values(toDbSaleInsert(header)).returning()

      const detailsWithId = details.map((d) => toDbSaleDetailInsert({ ...d, sale_id: sale.id }))
      await tx.insert(saleDetails).values(detailsWithId)

      const stockMovs: typeof stockMovements.$inferInsert[] = details.map((d) => ({
        item_id: d.item_id,
        type: 'OUT' as const,
        quantity: d.quantity,
        reference_type: 'sale' as const,
        reference_id: sale.id,
      }))
      await tx.insert(stockMovements).values(stockMovs)

      return { data: mapSale(sale as DbSale), error: null }
    })
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updateSale(
  id: number,
  header: SaleUpdate,
): Promise<{ data: Sale | null; error: Error | null }> {
  try {
    const [row] = await db
      .update(sales)
      .set({ ...toDbSaleUpdate(header), updated_at: new Date() })
      .where(eq(sales.id, id))
      .returning()
    if (!row) return { data: null, error: new Error('Sale not found') }
    return { data: mapSale(row as DbSale), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deleteSale(id: number): Promise<{ error: Error | null }> {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(stockMovements)
        .where(and(eq(stockMovements.reference_type, 'sale'), eq(stockMovements.reference_id, id)))
      await tx.delete(sales).where(eq(sales.id, id))
    })
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function generateInvoiceNumber(prefix: string = 'INV'): Promise<string> {
  const year = new Date().getFullYear()
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(sales)
    .where(ilike(sales.invoice_number, `${prefix}-${year}-%`))
  const nextNum = count + 1
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}
