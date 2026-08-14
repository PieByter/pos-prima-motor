import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    SalaryPayment,
    SalaryPaymentInsert,
    SalaryPaymentWithMechanic,
    PaginatedResponse,
} from '@/lib/types/database'

type SalaryPaymentFilters = {
    mechanicId?: string
    page?: number
    limit?: number
}

export async function getSalaryPayments(
    supabase: SupabaseClient,
    filters: SalaryPaymentFilters = {},
): Promise<{ data: PaginatedResponse<SalaryPaymentWithMechanic> | null; error: Error | null }> {
    try {
        const { mechanicId, page = 1, limit = 10 } = filters
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('salary_payments')
            .select('*, profiles!salary_payments_mechanic_id_profiles_id_fk(id, name), payment_methods(id, name)', { count: 'exact' })
            .order('payment_date', { ascending: false })
            .range(from, to)

        if (mechanicId) {
            query = query.eq('mechanic_id', mechanicId)
        }

        const { data, error, count } = await query

        if (error) return { data: null, error: new Error(error.message) }

        const mapped = (data ?? []).map((r) => ({
            ...r,
            mechanic: r.profiles ?? null,
            payment_method: r.payment_methods ?? null,
            profiles: undefined,
            payment_methods: undefined,
        }))

        return {
            data: {
                data: mapped as SalaryPaymentWithMechanic[],
                total: count ?? 0,
                page,
                limit,
                totalPages: Math.ceil((count ?? 0) / limit),
            },
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createSalaryPayment(
    supabase: SupabaseClient,
    data: SalaryPaymentInsert,
): Promise<{ data: SalaryPayment | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('salary_payments')
            .insert({
                ...data,
                amount: String(data.amount),
                notes: data.notes?.trim() ? data.notes.trim() : null,
            })
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed to create salary payment') }
        return { data: row as SalaryPayment, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deleteSalaryPayment(
    supabase: SupabaseClient,
    id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('salary_payments').delete().eq('id', id)
        return { error: error ? new Error(error.message) : null }
    } catch (err) {
        return { error: err as Error }
    }
}
