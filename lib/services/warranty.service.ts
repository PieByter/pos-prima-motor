import type { SupabaseClient } from '@supabase/supabase-js'

export type WarrantyEntry = {
    sale_detail_id: number
    sale_id: number
    invoice_number: string
    sale_date: string
    item_id: number
    item_name: string
    sku: string | null
    customer_name: string
    customer_phone: string | null
    warranty_months: number
    /** Tanggal garansi berakhir (sale_date + warranty_months) */
    warranty_until: string
    /** Sisa hari garansi (negatif = sudah kadaluarsa) */
    days_remaining: number
    status: 'active' | 'expiring' | 'expired'
}

const DAY_MS = 86400000

function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr)
    d.setMonth(d.getMonth() + months)
    return d.toISOString().slice(0, 10)
}

/**
 * Daftar semua item terjual yang masih dalam masa garansi.
 * status: active (masih lama) | expiring (≤ 30 hari) | expired (lewat)
 */
export async function getWarrantyList(
    supabase: SupabaseClient,
    statusFilter?: 'active' | 'expiring' | 'expired',
): Promise<{ data: WarrantyEntry[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('sale_details')
            .select('id, sale_id, item_id, warranty_months, quantity, sales(invoice_number, sale_date, customers(name, phone)), items(name, sku)')
            .not('warranty_months', 'is', null)
            .order('id', { ascending: false })

        if (error) return { data: null, error: new Error(error.message) }

        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const todayMs = today.getTime()

        const rows: WarrantyEntry[] = []
        for (const d of data ?? []) {
            const months = Number(d.warranty_months)
            if (!months || months <= 0) continue

            const sale = d.sales as unknown as {
                invoice_number: string
                sale_date: string
                customers?: { name?: string; phone?: string | null } | null
            } | null
            const item = d.items as unknown as { name?: string; sku?: string | null } | null
            const saleDate = sale?.sale_date ?? ''

            const warrantyUntil = addMonths(saleDate, months)
            const untilMs = new Date(warrantyUntil).getTime()
            const daysRemaining = Math.floor((untilMs - todayMs) / DAY_MS)
            const status: WarrantyEntry['status'] = daysRemaining < 0 ? 'expired' : daysRemaining <= 30 ? 'expiring' : 'active'

            if (statusFilter && status !== statusFilter) continue

            rows.push({
                sale_detail_id: d.id,
                sale_id: d.sale_id,
                invoice_number: sale?.invoice_number ?? '-',
                sale_date: saleDate,
                item_id: d.item_id,
                item_name: item?.name ?? 'Item',
                sku: item?.sku ?? null,
                customer_name: sale?.customers?.name ?? 'Walk-in',
                customer_phone: sale?.customers?.phone ?? null,
                warranty_months: months,
                warranty_until: warrantyUntil,
                days_remaining: daysRemaining,
                status,
            })
        }

        // Urut: yang paling dekat kadaluarsa di atas
        rows.sort((a, b) => a.days_remaining - b.days_remaining)

        return { data: rows, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}
