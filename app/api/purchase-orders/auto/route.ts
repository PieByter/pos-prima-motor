import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { createPurchaseOrder } from '@/lib/services/purchase-orders.service'

type StockRow = {
    item_id: number
    name: string
    sku: string | null
    current_stock: number
}

/**
 * Auto-generate draft Purchase Order dari item stok rendah.
 * Item dikelompokkan per supplier (preferensi: supplier pertama di item_suppliers),
 * lalu dibuatkan 1 draft PO per supplier.
 */
export async function POST() {
    try {
        const auth = await requireAuth()
        if (auth.errorResponse) return auth.errorResponse
        const user = auth.user

        const admin = createAdminClient()

        // 1. Item stok rendah (ambang 10, konsisten dengan restock-recommendations)
        const { data: stockData } = await admin
            .from('stock_summary')
            .select('item_id, name, sku, current_stock')
            .lte('current_stock', 10)
            .order('current_stock', { ascending: true })
            .limit(30)

        if (!stockData || stockData.length === 0) {
            return NextResponse.json({ created: 0, skipped_no_supplier: 0, suppliers: [] })
        }

        const rows = stockData as unknown as StockRow[]
        const itemIds = rows.map((s) => s.item_id)

        // 2. Kecepatan penjualan 30 hari terakhir (untuk menentukan qty rekomendasi)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const startStr = thirtyDaysAgo.toISOString().slice(0, 10)

        const { data: saleDetails } = await admin
            .from('sale_details')
            .select('item_id, quantity')
            .in('item_id', itemIds)
            .gte('created_at', startStr)

        const salesVelocity: Record<number, number> = {}
        for (const d of (saleDetails ?? []) as unknown as { item_id: number; quantity: number }[]) {
            salesVelocity[d.item_id] = (salesVelocity[d.item_id] ?? 0) + d.quantity
        }

        // 3. Harga beli item + relasi supplier
        const { data: items } = await admin
            .from('items')
            .select('id, purchase_price')
            .in('id', itemIds)

        const priceMap: Record<number, number> = {}
        for (const it of (items ?? []) as unknown as { id: number; purchase_price: number }[]) {
            priceMap[it.id] = Number(it.purchase_price ?? 0)
        }

        const { data: links } = await admin
            .from('item_suppliers')
            .select('item_id, supplier_id, purchase_price')
            .in('item_id', itemIds)

        // Supplier preferensi per item = link pertama; harga pakai harga khusus supplier (fallback harga item)
        const supplierOf: Record<number, number> = {}
        const supplierPrice: Record<number, number> = {}
        for (const l of (links ?? []) as unknown as { item_id: number; supplier_id: number; purchase_price: number | null }[]) {
            if (!(l.item_id in supplierOf)) {
                supplierOf[l.item_id] = l.supplier_id
                supplierPrice[l.item_id] = Number(l.purchase_price ?? priceMap[l.item_id] ?? 0)
            }
        }

        // 4. Kelompokkan per supplier
        const groups = new Map<number, { item_id: number; quantity: number; price: number }[]>()
        let skippedNoSupplier = 0
        for (const s of rows) {
            const supplierId = supplierOf[s.item_id]
            if (!supplierId) {
                skippedNoSupplier++
                continue
            }
            const sold30 = salesVelocity[s.item_id] ?? 0
            const avgDaily = Math.max(0.1, sold30 / 30)
            const qty = Math.max(Math.ceil(avgDaily * 14) - s.current_stock, 5)
            const entry = {
                item_id: s.item_id,
                quantity: qty,
                price: supplierPrice[s.item_id] || priceMap[s.item_id] || 0,
            }
            if (!groups.has(supplierId)) groups.set(supplierId, [])
            groups.get(supplierId)!.push(entry)
        }

        // 5. Buat draft PO per supplier
        const today = new Date().toISOString().slice(0, 10)
        const created: { id: number; po_number: string; supplier_id: number; items: number }[] = []
        let seq = 1
        for (const [supplierId, details] of groups) {
            const po_number = `PO-AUTO-${today.replace(/-/g, '')}-${String(seq++).padStart(2, '0')}`
            const { data, error } = await createPurchaseOrder(
                admin,
                {
                    supplier_id: supplierId,
                    po_number,
                    order_date: today,
                    expected_date: null,
                    status: 'draft',
                    total_amount: 0,
                    notes: 'Auto-generate dari rekomendasi restock',
                    created_by: user.id,
                },
                details,
            )
            if (error || !data) {
                console.error('Auto PO failed for supplier', supplierId, error)
                continue
            }
            created.push({ id: data.id, po_number: data.po_number, supplier_id: supplierId, items: details.length })
        }

        return NextResponse.json({ created: created.length, skipped_no_supplier: skippedNoSupplier, suppliers: created })
    } catch (err) {
        console.error('Auto PO unexpected error:', err)
        return NextResponse.json({ error: 'Failed to create purchase orders' }, { status: 500 })
    }
}
