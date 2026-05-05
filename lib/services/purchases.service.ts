import { db } from '@/lib/db'
import { purchases, purchaseDetails, suppliers, stockMovements } from '@/lib/db/schema'
import { eq, ilike, desc, sql, and, gte, lte, inArray } from 'drizzle-orm'
import type {
  Purchase,
  PurchaseInsert,
  PurchaseUpdate,
  PurchaseDetailInsert,
  PurchaseWithDetails,
  PaginatedResponse,
} from '@/lib/types/database'

type PurchaseFilters = {
  search?: string
  supplier_id?: number
  status?: string
  start_date?: string
  end_date?: string
  page?: number
  limit?: number
}

type DbPurchase = {
  id: number
  supplier_id: number
  invoice_number: string
  purchase_date: Date | string
  total_amount: string
  status: Purchase['status']
  created_by: string
  created_at: Date
  updated_at: Date
}

type DbPurchaseDetail = {
  id: number
  purchase_id: number
  item_id: number
  quantity: number
  price: string
  subtotal: string
}

type DbSupplier = {
  id: number
  name: string
  phone: string | null
  address: string | null
  created_at: Date
  updated_at: Date
}

const mapPurchase = (row: DbPurchase): Purchase => ({
  ...row,
  purchase_date:
    row.purchase_date instanceof Date
      ? row.purchase_date.toISOString().split('T')[0]
      : row.purchase_date,
  total_amount: Number(row.total_amount),
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

const mapPurchaseDetail = (row: DbPurchaseDetail) => ({
  ...row,
  price: Number(row.price),
  subtotal: Number(row.subtotal),
})

const mapSupplier = (row: DbSupplier) => ({
  ...row,
  created_at: row.created_at.toISOString(),
  updated_at: row.updated_at.toISOString(),
})

const toDbPurchaseInsert = (header: PurchaseInsert) => ({
  ...header,
  total_amount: header.total_amount.toString(),
})

const toDbPurchaseUpdate = (header: PurchaseUpdate) => ({
  ...header,
  total_amount: header.total_amount !== undefined ? header.total_amount.toString() : undefined,
})

const toDbPurchaseDetailInsert = (
  detail: Omit<PurchaseDetailInsert, 'purchase_id'> & { purchase_id: number },
) => ({
  ...detail,
  price: detail.price.toString(),
  subtotal: detail.subtotal.toString(),
})

export async function getPurchases(
  filters: PurchaseFilters = {},
): Promise<{ data: PaginatedResponse<Purchase> | null; error: Error | null }> {
  try {
    const { search, supplier_id, status, start_date, end_date, page = 1, limit = 10 } = filters
    const offset = (page - 1) * limit

    const conditions = []
    if (search) conditions.push(ilike(purchases.invoice_number, `%${search}%`))
    if (supplier_id) conditions.push(eq(purchases.supplier_id, supplier_id))
    if (status) conditions.push(eq(purchases.status, status as 'completed' | 'pending' | 'cancelled'))
    if (start_date) conditions.push(gte(purchases.purchase_date, start_date))
    if (end_date) conditions.push(lte(purchases.purchase_date, end_date))

    const where = conditions.length === 0 ? undefined : and(...conditions)

    const [rows, [{ count }]] = await Promise.all([
      db
        .select()
        .from(purchases)
        .where(where)
        .orderBy(desc(purchases.created_at))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(purchases)
        .where(where),
    ])

    // Enrich with supplier names
    const mappedRows = (rows as DbPurchase[]).map(mapPurchase)
    const supplierIds = [...new Set(mappedRows.map((r) => r.supplier_id).filter(Boolean))]
    const supplierMap = new Map<number, { name: string | null }>()
    if (supplierIds.length > 0) {
      const sRows = await db
        .select({ id: suppliers.id, name: suppliers.name })
        .from(suppliers)
        .where(inArray(suppliers.id, supplierIds))
      for (const s of sRows) supplierMap.set(s.id, { name: s.name })
    }

    const enriched = mappedRows.map((r) => ({
      ...r,
      supplier: supplierMap.get(r.supplier_id) ?? null,
    }))

    return {
      data: {
        data: enriched as Purchase[],
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

export async function getPurchaseById(
  id: number,
): Promise<{ data: PurchaseWithDetails | null; error: Error | null }> {
  try {
    const [purchase] = await db
      .select()
      .from(purchases)
      .where(eq(purchases.id, id))

    if (!purchase) return { data: null, error: new Error('Purchase not found') }

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, purchase.supplier_id))

    const detailRows = await db
      .select()
      .from(purchaseDetails)
      .where(eq(purchaseDetails.purchase_id, id))

    return {
      data: {
        ...mapPurchase(purchase as DbPurchase),
        supplier: supplier ? mapSupplier(supplier as DbSupplier) : undefined,
        details: detailRows.map((d) => mapPurchaseDetail(d as DbPurchaseDetail)),
      } as PurchaseWithDetails,
      error: null,
    }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function createPurchase(
  header: PurchaseInsert,
  details: Omit<PurchaseDetailInsert, 'purchase_id'>[],
): Promise<{ data: Purchase | null; error: Error | null }> {
  try {
    return await db.transaction(async (tx) => {
      const [purchase] = await tx.insert(purchases).values(toDbPurchaseInsert(header)).returning()

      const detailsWithId = details.map((d) => toDbPurchaseDetailInsert({ ...d, purchase_id: purchase.id }))
      await tx.insert(purchaseDetails).values(detailsWithId)

      const stockMovs: typeof stockMovements.$inferInsert[] = details.map((d) => ({
        item_id: d.item_id,
        type: 'IN' as const,
        quantity: d.quantity,
        reference_type: 'purchase' as const,
        reference_id: purchase.id,
      }))
      await tx.insert(stockMovements).values(stockMovs)

      return { data: mapPurchase(purchase as DbPurchase), error: null }
    })
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function updatePurchase(
  id: number,
  header: PurchaseUpdate,
): Promise<{ data: Purchase | null; error: Error | null }> {
  try {
    const [row] = await db
      .update(purchases)
      .set({ ...toDbPurchaseUpdate(header), updated_at: new Date() })
      .where(eq(purchases.id, id))
      .returning()
    if (!row) return { data: null, error: new Error('Purchase not found') }
    return { data: mapPurchase(row as DbPurchase), error: null }
  } catch (err) {
    return { data: null, error: err as Error }
  }
}

export async function deletePurchase(id: number): Promise<{ error: Error | null }> {
  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(stockMovements)
        .where(and(eq(stockMovements.reference_type, 'purchase'), eq(stockMovements.reference_id, id)))
      await tx.delete(purchases).where(eq(purchases.id, id))
    })
    return { error: null }
  } catch (err) {
    return { error: err as Error }
  }
}

export async function generateInvoiceNumber(prefix: string = 'PO'): Promise<string> {
  const year = new Date().getFullYear()
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(purchases)
    .where(ilike(purchases.invoice_number, `${prefix}-${year}-%`))
  const nextNum = count + 1
  return `${prefix}-${year}-${String(nextNum).padStart(3, '0')}`
}
