import type { SupabaseClient } from '@supabase/supabase-js'
import type { CustomerLoyalty, PointTransaction } from '@/lib/types/database'

/**
 * Ambil saldo poin + riwayat transaksi poin untuk satu customer.
 */
export async function getCustomerLoyalty(
    supabase: SupabaseClient,
    customerId: number,
): Promise<{ data: CustomerLoyalty | null; error: Error | null }> {
    try {
        const { data: customer } = await supabase
            .from('customers')
            .select('id, name, points')
            .eq('id', customerId)
            .maybeSingle()

        if (!customer) return { data: null, error: new Error('Customer not found') }

        const { data: txs, error: txError } = await supabase
            .from('point_transactions')
            .select('*')
            .eq('customer_id', customerId)
            .order('created_at', { ascending: false })
            .limit(100)

        if (txError) return { data: null, error: new Error(txError.message) }

        return {
            data: {
                customer_id: customer.id,
                customer_name: customer.name,
                balance: Number(customer.points ?? 0),
                transactions: (txs ?? []) as PointTransaction[],
            },
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/**
 * Tambah poin untuk customer (earn).
 * Mencatat riwayat lalu menaikkan saldo secara atomik via RPC.
 */
export async function earnPoints(
    supabase: SupabaseClient,
    customerId: number,
    points: number,
    reference: string | null,
    createdBy: string | null,
): Promise<{ data: PointTransaction | null; error: Error | null }> {
    if (!Number.isFinite(points) || points <= 0) {
        return { data: null, error: new Error('Points must be positive') }
    }
    try {
        const { data, error } = await supabase
            .from('point_transactions')
            .insert({ customer_id: customerId, points, type: 'earn', reference, created_by: createdBy })
            .select()
            .single()

        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed to earn points') }

        const { error: rpcError } = await supabase.rpc('increment_customer_points', {
            customer_id: customerId,
            delta: points,
        })
        if (rpcError) return { data: null, error: new Error(rpcError.message) }

        return { data, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/**
 * Tukar / kurangi poin customer (redeem).
 * Validasi saldo cukup, catat riwayat (negatif), lalu kurangi saldo.
 */
export async function redeemPoints(
    supabase: SupabaseClient,
    customerId: number,
    points: number,
    reference: string | null,
    createdBy: string | null,
): Promise<{ data: PointTransaction | null; error: Error | null }> {
    if (!Number.isFinite(points) || points <= 0) {
        return { data: null, error: new Error('Points must be positive') }
    }
    try {
        const { data: customer } = await supabase
            .from('customers')
            .select('points')
            .eq('id', customerId)
            .maybeSingle()

        const balance = Number(customer?.points ?? 0)
        if (balance < points) {
            return { data: null, error: new Error('Insufficient points') }
        }

        const { data, error } = await supabase
            .from('point_transactions')
            .insert({ customer_id: customerId, points: -points, type: 'redeem', reference, created_by: createdBy })
            .select()
            .single()

        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed to redeem points') }

        const { error: rpcError } = await supabase.rpc('increment_customer_points', {
            customer_id: customerId,
            delta: -points,
        })
        if (rpcError) return { data: null, error: new Error(rpcError.message) }

        return { data, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}
