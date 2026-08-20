import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/services/notifications.service'
import type { NotificationType } from '@/lib/types/notifications'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Centralized notification dispatching.
 * Called from Server Actions / API routes after key events.
 */

async function notifyAdmin(
    title: string,
    message: string,
    type: NotificationType = 'info',
    link?: string,
) {
    const admin = createAdminClient()

    // Get all admin user IDs
    const { data: admins } = await admin
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .eq('is_active', true)

    if (!admins || admins.length === 0) return

    for (const a of admins) {
        await createNotification(admin, {
            user_id: a.id,
            title,
            message,
            type,
            is_read: false,
            link: link ?? null,
        })
    }
}

/**
 * Stock low alert — triggered after sale or purchase.
 * Call AFTER stock mutation (stock_movements insert).
 */
export async function checkAndNotifyLowStock(itemName: string, itemId: number, currentStock: number) {
    if (currentStock <= 2) {
        await notifyAdmin(
            'Stok Kritis! 🔴',
            `"${itemName}" tinggal ${currentStock} pcs. Segera restock!`,
            'error',
            `/dashboard/inventory`,
        )
    } else if (currentStock <= 5) {
        await notifyAdmin(
            'Stok Menipis ⚠️',
            `"${itemName}" tinggal ${currentStock} pcs.`,
            'warning',
            `/dashboard/inventory`,
        )
    }
}

/**
 * Large transaction alert — triggered after sale creation.
 */
export async function notifyLargeTransaction(
    saleId: number,
    invoiceNumber: string,
    totalAmount: number,
    customerName: string,
) {
    const threshold = 1_000_000 // Rp 1 juta
    if (totalAmount < threshold) return

    await notifyAdmin(
        'Transaksi Besar 💰',
        `Invoice ${invoiceNumber} oleh ${customerName || 'Walk-in'} senilai ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount)}`,
        'success',
        `/dashboard/transactions/sales/${saleId}`,
    )
}

/**
 * Return/retur alert — triggered after return creation.
 */
export async function notifyReturnCreated(
    returnType: 'sale' | 'purchase',
    returnId: number,
    reason: string,
) {
    const label = returnType === 'sale' ? 'Retur Penjualan' : 'Retur Pembelian'
    await notifyAdmin(
        `Retur Dibuat 🔄`,
        `${label} #${returnId} — Alasan: ${reason}`,
        'info',
        `/dashboard/returns/${returnType}s`,
    )
}

/**
 * New expense recorded.
 */
export async function notifyNewExpense(
    expenseId: number,
    description: string,
    amount: number,
) {
    await notifyAdmin(
        'Pengeluaran Baru 💸',
        `${description} — ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)}`,
        'info',
        `/dashboard/expenses`,
    )
}

/**
 * Notify mechanic about their own sale created.
 */
export async function notifyMechanicSaleCreated(
    mechanicId: string,
    saleId: number,
    invoiceNumber: string,
    totalAmount: number,
    serviceFees: number,
) {
    const admin = createAdminClient()
    await createNotification(admin, {
        user_id: mechanicId,
        title: 'Transaksi Baru ✅',
        message: `Invoice ${invoiceNumber} berhasil. Omset: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalAmount)}, Jasa: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(serviceFees)}`,
        type: 'success',
        is_read: false,
        link: `/dashboard/transactions/sales/${saleId}`,
    })
}

/**
 * Notifikasi otomatis piutang jatuh tempo — dipanggil saat laporan piutang
 * dibuka (fire-and-forget). Hanya membuat notifikasi SEKALI per invoice
 * (deduplikasi berdasarkan link + judul yang sudah ada).
 */
export async function notifyOverdueReceivables(supabase: SupabaseClient): Promise<number> {
    try {
        // Ambil semua penjualan belum lunas
        const { data: sales } = await supabase
            .from('sales')
            .select('id, invoice_number, sale_date, remaining_amount, customers(name)')
            .eq('status', 'completed')
            .in('payment_status', ['partial', 'unpaid'])

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Filter yang sudah lewat jatuh tempo (umur >= 1 hari)
        const overdue = (sales ?? []).filter((s) => {
            const saleDate = new Date(s.sale_date)
            const aging = Math.floor((today.getTime() - saleDate.getTime()) / 86400000)
            return aging >= 1
        })

        if (overdue.length === 0) return 0

        const links = overdue.map((s) => `/dashboard/transactions/sales/${s.id}`)

        // Deduplikasi — cek notifikasi piutang yang sudah ada untuk invoice tsb
        const { data: existing } = await supabase
            .from('notifications')
            .select('link')
            .in('link', links)
            .eq('title', 'Piutang Jatuh Tempo 💳')

        const existingLinks = new Set((existing ?? []).map((n) => n.link))
        const toNotify = overdue.filter((s) => !existingLinks.has(`/dashboard/transactions/sales/${s.id}`))
        if (toNotify.length === 0) return 0

        const admin = createAdminClient()
        const { data: admins } = await admin
            .from('profiles')
            .select('id')
            .eq('role', 'admin')
            .eq('is_active', true)

        if (!admins || admins.length === 0) return 0

        let created = 0
        for (const s of toNotify) {
            const remaining = Number(s.remaining_amount ?? 0)
            const customerName = (s.customers as { name?: string | null } | null)?.name ?? 'Walk-in'
            for (const a of admins) {
                await createNotification(admin, {
                    user_id: a.id,
                    title: 'Piutang Jatuh Tempo 💳',
                    message: `Invoice ${s.invoice_number} — sisa ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(remaining)} (${customerName})`,
                    type: 'warning',
                    is_read: false,
                    link: `/dashboard/transactions/sales/${s.id}`,
                })
                created++
            }
        }
        return created
    } catch (err) {
        console.error('Failed to notify overdue receivables:', err)
        return 0
    }
}

/**
 * Notifikasi PO diterima — dipanggil saat status PO diubah menjadi 'received'.
 * Barang sudah masuk stok (transaksi pembelian otomatis dibuat).
 */
export async function notifyPurchaseOrderReceived(
    poId: number,
    poNumber: string,
    supplierName: string,
    purchaseInvoiceNumber?: string | null,
) {
    const msg = purchaseInvoiceNumber
        ? `PO ${poNumber} dari ${supplierName} sudah diterima. Barang masuk stok (${purchaseInvoiceNumber}).`
        : `PO ${poNumber} dari ${supplierName} sudah diterima. Barang masuk stok.`

    await notifyAdmin(
        'PO Diterima 📦',
        msg,
        'success',
        `/dashboard/transactions/purchase-orders`,
    )

    void poId
}
