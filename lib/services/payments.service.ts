import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    Sale,
    SalePayment,
    SalePaymentInsert,
    SalePaymentWithMethod,
} from '@/lib/types/database'

type SupabaseRow = Record<string, unknown>

function mapPayment(row: SupabaseRow): SalePayment {
    return {
        ...row,
        amount: Number(row.amount),
        payment_method: undefined,
    } as unknown as SalePayment
}

/** Daftar pembayaran sebuah sale (terbaru dulu) */
export async function getSalePayments(
    supabase: SupabaseClient,
    saleId: number,
): Promise<{ data: SalePaymentWithMethod[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('sale_payments')
            .select('*, payment_methods(id, name, icon)')
            .eq('sale_id', saleId)
            .order('payment_date', { ascending: false })
            .order('created_at', { ascending: false })

        if (error) return { data: null, error: new Error(error.message) }

        const rows = (data ?? []).map((r) => ({
            ...mapPayment(r),
            payment_method: r.payment_methods ?? null,
            payment_methods: undefined,
        }))

        return { data: rows as SalePaymentWithMethod[], error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/**
 * Catat pembayaran baru & update status sale:
 * paid_amount += amount; remaining = total - paid;
 * payment_status = remaining <= 0 ? 'paid' : 'partial'
 */
export async function createSalePayment(
    supabase: SupabaseClient,
    saleId: number,
    data: Omit<SalePaymentInsert, 'sale_id'>,
    userId?: string,
): Promise<{ data: SalePaymentWithMethod | null; error: Error | null }> {
    try {
        const amount = Number(data.amount)
        if (!amount || amount <= 0) {
            return { data: null, error: new Error('Jumlah pembayaran harus lebih dari 0') }
        }

        // 1. Baca sale saat ini
        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .select('id, total_amount, paid_amount, remaining_amount, payment_status')
            .eq('id', saleId)
            .single()

        if (saleError || !sale) return { data: null, error: new Error('Transaksi tidak ditemukan') }

        const total = Number(sale.total_amount)
        const alreadyPaid = Number(sale.paid_amount ?? 0)
        const remaining = Math.max(0, total - alreadyPaid)

        if (amount > remaining) {
            return {
                data: null,
                error: new Error(`Jumlah melebihi sisa tagihan (sisa: ${remaining.toLocaleString('id-ID')})`),
            }
        }

        // 2. Insert payment
        const { data: row, error: insertError } = await supabase
            .from('sale_payments')
            .insert({
                sale_id: saleId,
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

        // 3. Update sale
        const newPaid = alreadyPaid + amount
        const newRemaining = Math.max(0, total - newPaid)
        const newStatus = newRemaining <= 0 ? 'paid' : 'partial'

        const { error: updateError } = await supabase
            .from('sales')
            .update({
                paid_amount: newPaid,
                remaining_amount: newRemaining,
                payment_status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', saleId)

        if (updateError) {
            // Rollback payment kalau update sale gagal
            await supabase.from('sale_payments').delete().eq('id', row.id)
            return { data: null, error: new Error(updateError.message) }
        }

        return {
            data: {
                ...mapPayment(row),
                payment_method: row.payment_methods ?? null,
                payment_methods: undefined,
            } as SalePaymentWithMethod,
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/** Hapus pembayaran & hitung ulang status sale */
export async function deleteSalePayment(
    supabase: SupabaseClient,
    paymentId: number,
): Promise<{ error: Error | null }> {
    try {
        const { data: payment, error: findError } = await supabase
            .from('sale_payments')
            .select('id, sale_id, amount')
            .eq('id', paymentId)
            .single()

        if (findError || !payment) return { error: new Error('Pembayaran tidak ditemukan') }

        const saleId = payment.sale_id as number

        const { error: deleteError } = await supabase.from('sale_payments').delete().eq('id', paymentId)
        if (deleteError) return { error: new Error(deleteError.message) }

        // Hitung ulang dari sisa pembayaran sale ini saja (bukan semua sale!)
        const { data: rest, error: restError } = await supabase
            .from('sale_payments')
            .select('amount')
            .eq('sale_id', saleId)

        if (restError) return { error: new Error(restError.message) }

        const { data: sale, error: saleError } = await supabase
            .from('sales')
            .select('id, total_amount')
            .eq('id', saleId)
            .single()

        if (saleError || !sale) return { error: new Error('Transaksi tidak ditemukan') }

        const total = Number(sale.total_amount)
        const stillPaid = (rest ?? []).reduce((sum, p) => sum + Number(p.amount), 0)
        const newPaid = Math.max(0, stillPaid)
        const newRemaining = Math.max(0, total - newPaid)
        const newStatus = newRemaining <= 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid'

        const { error: updateError } = await supabase
            .from('sales')
            .update({
                paid_amount: newPaid,
                remaining_amount: newRemaining,
                payment_status: newStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', saleId)

        if (updateError) return { error: new Error(updateError.message) }
        return { error: null }
    } catch (err) {
        return { error: err as Error }
    }
}

/** Sisa tagihan helper untuk dipakai di laporan piutang */
export function computeRemaining(sale: { total_amount: number; paid_amount: number | null }): number {
    return Math.max(0, Number(sale.total_amount) - Number(sale.paid_amount ?? 0))
}

export type { Sale }
