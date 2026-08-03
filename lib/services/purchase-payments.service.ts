import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    PurchasePayment,
    PurchasePaymentInsert,
    PurchasePaymentWithMethod,
} from '@/lib/types/database'

type SupabaseRow = Record<string, unknown>

function mapPayment(row: SupabaseRow): PurchasePayment {
    return {
        ...row,
        amount: Number(row.amount),
        payment_method: undefined,
    } as unknown as PurchasePayment
}

/** Daftar pembayaran sebuah purchase (terbaru dulu) */
export async function getPurchasePayments(
    supabase: SupabaseClient,
    purchaseId: number,
): Promise<{ data: PurchasePaymentWithMethod[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('purchase_payments')
            .select('*, payment_methods(id, name, icon)')
            .eq('purchase_id', purchaseId)
            .order('payment_date', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) return { data: null, error: new Error(error.message) }

        const rows = (data ?? []).map((r) => ({
            ...mapPayment(r),
            payment_method: r.payment_methods ?? null,
            payment_methods: undefined,
        }))

        return { data: rows as PurchasePaymentWithMethod[], error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/**
 * Catat pembayaran ke supplier & update status purchase:
 * paid_amount += amount; remaining = total - paid;
 * payment_status = remaining <= 0 ? 'paid' : 'partial'
 */
export async function createPurchasePayment(
    supabase: SupabaseClient,
    purchaseId: number,
    data: Omit<PurchasePaymentInsert, 'purchase_id'>,
    userId?: string,
): Promise<{ data: PurchasePaymentWithMethod | null; error: Error | null }> {
    try {
        const amount = Number(data.amount)
        if (!amount || amount <= 0) {
            return { data: null, error: new Error('Jumlah pembayaran harus lebih dari 0') }
        }

        // 1. Baca purchase saat ini
        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .select('id, total_amount, paid_amount, remaining_amount, payment_status')
            .eq('id', purchaseId)
            .single()

        if (purchaseError || !purchase) return { data: null, error: new Error('Transaksi tidak ditemukan') }

        const total = Number(purchase.total_amount)
        const alreadyPaid = Number(purchase.paid_amount ?? 0)
        const remaining = Math.max(0, total - alreadyPaid)

        if (amount > remaining) {
            return {
                data: null,
                error: new Error(`Jumlah melebihi sisa tagihan (sisa: ${remaining.toLocaleString('id-ID')})`),
            }
        }

        // 2. Insert payment
        const { data: row, error: insertError } = await supabase
            .from('purchase_payments')
            .insert({
                purchase_id: purchaseId,
                amount,
                payment_date: data.payment_date ?? new Date().toISOString().slice(0, 10),
                payment_method_id: data.payment_method_id ?? null,
                notes: data.notes?.trim() ? data.notes.trim() : null,
                created_by: userId ?? null,
            })
            .select('*, payment_methods(id, name, icon)')
            .single()

        if (insertError || !row) {
            return { data: null, error: new Error(insertError?.message ?? 'Gagal menyimpan pembayaran') }
        }

        // 3. Update purchase
        const newPaid = alreadyPaid + amount
        const newRemaining = Math.max(0, total - newPaid)
        const newStatus = newRemaining <= 0 ? 'paid' : 'partial'

        const { error: updateError } = await supabase
            .from('purchases')
            .update({
                paid_amount: newPaid,
                remaining_amount: newRemaining,
                payment_status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', purchaseId)

        if (updateError) {
            // Rollback payment kalau update purchase gagal
            await supabase.from('purchase_payments').delete().eq('id', row.id)
            return { data: null, error: new Error(updateError.message) }
        }

        return {
            data: {
                ...mapPayment(row),
                payment_method: row.payment_methods ?? null,
                payment_methods: undefined,
            } as PurchasePaymentWithMethod,
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/** Hapus pembayaran & hitung ulang status purchase */
export async function deletePurchasePayment(
    supabase: SupabaseClient,
    paymentId: number,
): Promise<{ error: Error | null }> {
    try {
        const { data: payment, error: findError } = await supabase
            .from('purchase_payments')
            .select('id, purchase_id, amount')
            .eq('id', paymentId)
            .single()

        if (findError || !payment) return { error: new Error('Pembayaran tidak ditemukan') }

        const purchaseId = payment.purchase_id as number

        const { error: deleteError } = await supabase.from('purchase_payments').delete().eq('id', paymentId)
        if (deleteError) return { error: new Error(deleteError.message) }

        // Hitung ulang dari sisa pembayaran purchase ini saja
        const { data: rest, error: restError } = await supabase
            .from('purchase_payments')
            .select('amount')
            .eq('purchase_id', purchaseId)

        if (restError) return { error: new Error(restError.message) }

        const { data: purchase, error: purchaseError } = await supabase
            .from('purchases')
            .select('id, total_amount')
            .eq('id', purchaseId)
            .single()

        if (purchaseError || !purchase) return { error: new Error('Transaksi tidak ditemukan') }

        const total = Number(purchase.total_amount)
        const stillPaid = (rest ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
        const newPaid = Math.max(0, stillPaid)
        const newRemaining = Math.max(0, total - newPaid)
        const newStatus = newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

        const { error: updateError } = await supabase
            .from('purchases')
            .update({
                paid_amount: newPaid,
                remaining_amount: newRemaining,
                payment_status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', purchaseId)

        if (updateError) return { error: new Error(updateError.message) }
        return { error: null }
    } catch (err) {
        return { error: err as Error }
    }
}
