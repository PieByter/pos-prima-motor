import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

/**
 * GET /api/export?type=sales|purchases|items|customers|suppliers|expenses
 *
 * Exports data as CSV. The frontend can trigger a download via:
 *   window.open('/api/export?type=sales&start_date=...&end_date=...')
 */
export async function GET(request: NextRequest) {
    const auth = await requireAuth()
    if (auth.errorResponse) return auth.errorResponse

    const sp = request.nextUrl.searchParams
    const type = sp.get('type') ?? 'sales'
    const startDate = sp.get('start_date')
    const endDate = sp.get('end_date')

    const admin = createAdminClient()
    let rows: any[] = []
    let filename = ''

    try {
        switch (type) {
            case 'sales': {
                filename = 'sales-export.csv'
                let q = admin.from('sales')
                    .select('*, customers(name), profiles(name)')
                    .order('created_at', { ascending: false })
                if (startDate) q = q.gte('sale_date', startDate)
                if (endDate) q = q.lte('sale_date', endDate)
                const { data } = await q
                rows = (data ?? []).map((r: any) => ({
                    Invoice: r.invoice_number,
                    Tanggal: r.sale_date,
                    Customer: r.customers?.name ?? 'Walk-in',
                    Mekanik: r.profiles?.name ?? '-',
                    Status: r.status,
                    Total: Number(r.total_amount),
                }))
                break
            }

            case 'purchases': {
                filename = 'purchases-export.csv'
                let q = admin.from('purchases')
                    .select('*, suppliers(name)')
                    .order('created_at', { ascending: false })
                if (startDate) q = q.gte('purchase_date', startDate)
                if (endDate) q = q.lte('purchase_date', endDate)
                const { data } = await q
                rows = (data ?? []).map((r: any) => ({
                    Invoice: r.invoice_number,
                    Tanggal: r.purchase_date,
                    Supplier: r.suppliers?.name ?? '-',
                    Status: r.status,
                    Total: Number(r.total_amount),
                }))
                break
            }

            case 'items': {
                filename = 'items-export.csv'
                const { data } = await admin.from('items')
                    .select('*, categories(name), brands(name)')
                    .order('name', { ascending: true })
                rows = (data ?? []).map((r: any) => ({
                    Nama: r.name,
                    SKU: r.sku ?? '-',
                    Kategori: r.categories?.name ?? r.category ?? '-',
                    Merek: r.brands?.name ?? '-',
                    'Harga Beli': Number(r.purchase_price),
                    'Harga Jual': Number(r.selling_price),
                    'Fee Service': Number(r.service_fee),
                }))
                break
            }

            case 'customers': {
                filename = 'customers-export.csv'
                const { data } = await admin.from('customers')
                    .select('*')
                    .order('name', { ascending: true })
                rows = (data ?? []).map((r: any) => ({
                    Nama: r.name,
                    Telepon: r.phone ?? '-',
                    Alamat: r.address ?? '-',
                }))
                break
            }

            case 'suppliers': {
                filename = 'suppliers-export.csv'
                const { data } = await admin.from('suppliers')
                    .select('*')
                    .order('name', { ascending: true })
                rows = (data ?? []).map((r: any) => ({
                    Nama: r.name,
                    Telepon: r.phone ?? '-',
                    Alamat: r.address ?? '-',
                }))
                break
            }

            case 'expenses': {
                filename = 'expenses-export.csv'
                let q = admin.from('expenses')
                    .select('*')
                    .order('expense_date', { ascending: false })
                if (startDate) q = q.gte('expense_date', startDate)
                if (endDate) q = q.lte('expense_date', endDate)
                const { data } = await q
                rows = (data ?? []).map((r: any) => ({
                    Deskripsi: r.description,
                    Kategori: r.category,
                    Tanggal: r.expense_date,
                    Jumlah: Number(r.amount),
                    Catatan: r.notes ?? '-',
                }))
                break
            }

            default:
                return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
        }

        // ── Convert to CSV ────────────────────────────────────────────────
        if (rows.length === 0) {
            return new NextResponse('Tidak ada data untuk diexport', {
                headers: { 'Content-Type': 'text/csv; charset=utf-8' },
            })
        }

        const headers = Object.keys(rows[0])
        const csvLines = [
            headers.join(','),
            ...rows.map((row) =>
                headers.map((h) => {
                    const val = row[h]
                    if (val == null) return ''
                    const str = String(val)
                    // Escape quotes and wrap in quotes if contains comma
                    return str.includes(',') || str.includes('"') || str.includes('\n')
                        ? `"${str.replace(/"/g, '""')}"`
                        : str
                }).join(','),
            ),
        ]

        const csvContent = csvLines.join('\n')

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        })
    } catch (err) {
        console.error('Export error:', err)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}
