import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import * as XLSX from 'xlsx'

/**
 * GET /api/export?type=sales|purchases|items|customers|suppliers|expenses|profit-loss
 *
 * Exports data as a formatted .xlsx file.
 *   window.open('/api/export?type=sales&start_date=...&end_date=...')
 */

type ColumnDef = { header: string; key: string; width?: number; format?: string }
type SheetDef = { name: string; columns: ColumnDef[]; rows: Record<string, unknown>[] }

/** Helper: create a workbook sheet from column definitions + rows */
function buildSheet(data: SheetDef) {
    const ws = XLSX.utils.json_to_sheet(data.rows, { header: data.columns.map((c) => c.key) })

    // Set column widths
    ws['!cols'] = data.columns.map((c) => ({ wch: c.width ?? 20 }))

    // Apply number formatting if specified
    if (data.columns.some((c) => c.format)) {
        const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1')
        for (let R = range.s.r + 1; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const addr = XLSX.utils.encode_cell({ r: R, c: C })
                const cell = ws[addr]
                if (!cell) continue
                const colDef = data.columns[C]
                if (colDef?.format && typeof cell.v === 'number') {
                    cell.z = colDef.format
                }
            }
        }
    }

    return ws
}

export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const sp = request.nextUrl.searchParams
    const type = sp.get('type') ?? 'sales'
    const startDate = sp.get('start_date')
    const endDate = sp.get('end_date')
    const idsParam = sp.get('ids') // comma-separated IDs for bulk export

    const admin = createAdminClient()
    const sheets: SheetDef[] = []

    try {
        switch (type) {
            case 'sales': {
                let q = admin.from('sales')
                    .select('*, customers(name), profiles(name)')
                    .order('created_at', { ascending: false })
                if (startDate) q = q.gte('sale_date', startDate)
                if (endDate) q = q.lte('sale_date', endDate)
                const { data } = await q
                const rows = (data ?? []).map((r: any) => ({
                    invoice: r.invoice_number,
                    date: r.sale_date,
                    customer: r.customers?.name ?? 'Walk-in',
                    mechanic: r.profiles?.name ?? '-',
                    status: r.status === 'completed' ? 'Selesai' : r.status === 'pending' ? 'Tertunda' : 'Dibatalkan',
                    total: Number(r.total_amount),
                }))
                sheets.push({
                    name: 'Penjualan',
                    columns: [
                        { header: 'Invoice', key: 'invoice', width: 18 },
                        { header: 'Tanggal', key: 'date', width: 14 },
                        { header: 'Customer', key: 'customer', width: 22 },
                        { header: 'Mekanik', key: 'mechanic', width: 18 },
                        { header: 'Status', key: 'status', width: 12 },
                        { header: 'Total (Rp)', key: 'total', width: 16, format: '#,##0' },
                    ],
                    rows,
                })
                break
            }

            case 'purchases': {
                let q = admin.from('purchases')
                    .select('*, suppliers(name)')
                    .order('created_at', { ascending: false })
                if (startDate) q = q.gte('purchase_date', startDate)
                if (endDate) q = q.lte('purchase_date', endDate)
                const { data } = await q
                const rows = (data ?? []).map((r: any) => ({
                    invoice: r.invoice_number,
                    date: r.purchase_date,
                    supplier: r.suppliers?.name ?? '-',
                    status: r.status === 'completed' ? 'Selesai' : r.status === 'pending' ? 'Tertunda' : 'Dibatalkan',
                    total: Number(r.total_amount),
                }))
                sheets.push({
                    name: 'Pembelian',
                    columns: [
                        { header: 'Invoice', key: 'invoice', width: 18 },
                        { header: 'Tanggal', key: 'date', width: 14 },
                        { header: 'Supplier', key: 'supplier', width: 22 },
                        { header: 'Status', key: 'status', width: 12 },
                        { header: 'Total (Rp)', key: 'total', width: 16, format: '#,##0' },
                    ],
                    rows,
                })
                break
            }

            case 'items': {
                let q = admin.from('items')
                    .select('*, categories(name), brands(name)')
                    .order('name', { ascending: true })

                // Filter by IDs if provided (for bulk export)
                if (idsParam) {
                    const ids = idsParam.split(',').map(Number).filter(Boolean)
                    if (ids.length > 0) q = q.in('id', ids)
                }

                const { data } = await q
                const rows = (data ?? []).map((r: any) => ({
                    name: r.name,
                    sku: r.sku ?? '-',
                    category: r.categories?.name ?? r.category ?? '-',
                    brand: r.brands?.name ?? '-',
                    purchase_price: Number(r.purchase_price),
                    selling_price: Number(r.selling_price),
                    service_fee: Number(r.service_fee),
                }))
                sheets.push({
                    name: 'Barang',
                    columns: [
                        { header: 'Nama Barang', key: 'name', width: 28 },
                        { header: 'SKU', key: 'sku', width: 14 },
                        { header: 'Kategori', key: 'category', width: 16 },
                        { header: 'Merek', key: 'brand', width: 16 },
                        { header: 'Harga Beli', key: 'purchase_price', width: 14, format: '#,##0' },
                        { header: 'Harga Jual', key: 'selling_price', width: 14, format: '#,##0' },
                        { header: 'Fee Service', key: 'service_fee', width: 14, format: '#,##0' },
                    ],
                    rows,
                })
                break
            }

            case 'customers': {
                const { data } = await admin.from('customers')
                    .select('*')
                    .order('name', { ascending: true })
                const rows = (data ?? []).map((r: any) => ({
                    name: r.name,
                    phone: r.phone ?? '-',
                    address: r.address ?? '-',
                }))
                sheets.push({
                    name: 'Customer',
                    columns: [
                        { header: 'Nama', key: 'name', width: 24 },
                        { header: 'Telepon', key: 'phone', width: 18 },
                        { header: 'Alamat', key: 'address', width: 32 },
                    ],
                    rows,
                })
                break
            }

            case 'suppliers': {
                const { data } = await admin.from('suppliers')
                    .select('*')
                    .order('name', { ascending: true })
                const rows = (data ?? []).map((r: any) => ({
                    name: r.name,
                    phone: r.phone ?? '-',
                    address: r.address ?? '-',
                }))
                sheets.push({
                    name: 'Supplier',
                    columns: [
                        { header: 'Nama', key: 'name', width: 24 },
                        { header: 'Telepon', key: 'phone', width: 18 },
                        { header: 'Alamat', key: 'address', width: 32 },
                    ],
                    rows,
                })
                break
            }

            case 'expenses': {
                let q = admin.from('expenses')
                    .select('*')
                    .order('expense_date', { ascending: false })
                if (startDate) q = q.gte('expense_date', startDate)
                if (endDate) q = q.lte('expense_date', endDate)
                const { data } = await q
                const rows = (data ?? []).map((r: any) => ({
                    description: r.description,
                    category: r.category,
                    date: r.expense_date,
                    amount: Number(r.amount),
                    notes: r.notes ?? '-',
                }))
                sheets.push({
                    name: 'Pengeluaran',
                    columns: [
                        { header: 'Deskripsi', key: 'description', width: 28 },
                        { header: 'Kategori', key: 'category', width: 16 },
                        { header: 'Tanggal', key: 'date', width: 14 },
                        { header: 'Jumlah (Rp)', key: 'amount', width: 16, format: '#,##0' },
                        { header: 'Catatan', key: 'notes', width: 24 },
                    ],
                    rows,
                })
                break
            }

            case 'profit-loss': {
                // Sales data
                let salesQ = admin.from('sales')
                    .select('total_amount, sale_details!inner(quantity, base_price, service_fee, discount_amount, item_id, items!inner(purchase_price, name))')
                    .eq('status', 'completed')
                if (startDate) salesQ = salesQ.gte('sale_date', startDate)
                if (endDate) salesQ = salesQ.lte('sale_date', endDate)
                const { data: salesData } = await salesQ

                // Aggregate profit per item
                const itemProfit: Record<number, { name: string; qty: number; modal: number; jual: number; laba: number; jasa: number }> = {}
                let totalSales = 0, totalHpp = 0, totalJasa = 0

                for (const sale of (salesData ?? []) as any[]) {
                    for (const detail of (sale.sale_details ?? []) as any[]) {
                        const itemId = detail.item_id
                        const itemName = detail.items?.name ?? 'Unknown'
                        const purchasePrice = Number(detail.items?.purchase_price ?? 0)
                        const qty = Number(detail.quantity)
                        const basePrice = Number(detail.base_price)
                        const serviceFee = Number(detail.service_fee)
                        const discount = Number(detail.discount_amount)
                        const subtotal = basePrice * qty - discount + serviceFee

                        totalSales += subtotal
                        totalHpp += purchasePrice * qty
                        totalJasa += serviceFee

                        if (!itemProfit[itemId]) {
                            itemProfit[itemId] = { name: itemName, qty: 0, modal: purchasePrice, jual: 0, laba: 0, jasa: 0 }
                        }
                        itemProfit[itemId].qty += qty
                        itemProfit[itemId].jual += basePrice * qty
                        itemProfit[itemId].laba += (basePrice - purchasePrice) * qty
                        itemProfit[itemId].jasa += serviceFee
                    }
                }

                const profitRows = Object.values(itemProfit).map((p) => ({
                    name: p.name,
                    qty: p.qty,
                    modal: p.modal,
                    jual: Math.round(p.jual / p.qty),
                    laba: p.laba,
                    margin: p.modal > 0 ? Math.round((p.laba / (p.modal * p.qty)) * 100) : 0,
                }))

                // Summary sheet
                const grossProfit = totalSales - totalHpp
                sheets.push({
                    name: 'Ringkasan',
                    columns: [
                        { header: 'Keterangan', key: 'label', width: 30 },
                        { header: 'Jumlah (Rp)', key: 'value', width: 20, format: '#,##0' },
                    ],
                    rows: [
                        { label: 'Total Penjualan', value: totalSales },
                        { label: 'Modal (HPP)', value: totalHpp },
                        { label: 'Laba Kotor', value: grossProfit },
                        { label: 'Total Jasa Service', value: totalJasa },
                        { label: 'Laba Bersih', value: grossProfit + totalJasa },
                    ],
                })

                sheets.push({
                    name: 'Laba per Item',
                    columns: [
                        { header: 'Nama Item', key: 'name', width: 28 },
                        { header: 'Qty Terjual', key: 'qty', width: 14 },
                        { header: 'Modal/Unit', key: 'modal', width: 14, format: '#,##0' },
                        { header: 'Harga Jual Rata-rata', key: 'jual', width: 18, format: '#,##0' },
                        { header: 'Laba Kotor', key: 'laba', width: 16, format: '#,##0' },
                        { header: 'Margin (%)', key: 'margin', width: 14 },
                    ],
                    rows: profitRows,
                })
                break
            }

            default:
                return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
        }

        if (sheets.length === 0 || sheets.every((s) => s.rows.length === 0)) {
            return new NextResponse('Tidak ada data untuk diexport', {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
        }

        // ── Build workbook ────────────────────────────────────────────────
        const wb = XLSX.utils.book_new()
        for (const sheet of sheets) {
            if (sheet.rows.length > 0) {
                const ws = buildSheet(sheet)
                XLSX.utils.book_append_sheet(wb, ws, sheet.name)
            }
        }

        const filename = `${type}-export-${new Date().toISOString().slice(0, 10)}.xlsx`
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (err) {
        console.error('Export error:', err)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}
