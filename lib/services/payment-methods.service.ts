import type { SupabaseClient } from '@supabase/supabase-js'
import type { PaymentMethod, PaymentMethodInsert, PaymentMethodUpdate } from '@/lib/types/database'

export async function getPaymentMethods(
    supabase: SupabaseClient,
): Promise<{ data: PaymentMethod[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .order('id', { ascending: true })

        if (error) return { data: null, error: new Error(error.message) }

        return { data: data as PaymentMethod[], error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function getPaymentMethodById(
    supabase: SupabaseClient,
    id: number,
): Promise<{ data: PaymentMethod | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .select('*')
            .eq('id', id)
            .single()

        if (error || !data) return { data: null, error: new Error('Payment method not found') }
        return { data: data as PaymentMethod, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createPaymentMethod(
    supabase: SupabaseClient,
    payload: PaymentMethodInsert,
): Promise<{ data: PaymentMethod | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .insert(payload)
            .select()
            .single()

        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed to create payment method') }
        return { data: data as PaymentMethod, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updatePaymentMethod(
    supabase: SupabaseClient,
    id: number,
    payload: PaymentMethodUpdate,
): Promise<{ data: PaymentMethod | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('payment_methods')
            .update(payload)
            .eq('id', id)
            .select()
            .single()

        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed to update payment method') }
        return { data: data as PaymentMethod, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deletePaymentMethod(
    supabase: SupabaseClient,
    id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('payment_methods').delete().eq('id', id)
        return { error: error ? new Error(error.message) : null }
    } catch (err) {
        return { error: err as Error }
    }
}
