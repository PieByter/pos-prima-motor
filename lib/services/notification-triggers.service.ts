import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/services/notifications.service'
import type { NotificationType } from '@/lib/types/notifications'

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
