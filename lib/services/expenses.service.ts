import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    Expense, ExpenseInsert, ExpenseUpdate,
    PaginatedResponse,
} from '@/lib/types/database'

type ExpenseFilters = {
    category?: string
    start_date?: string
    end_date?: string
    page?: number
    limit?: number
}

type SupabaseRow = Record<string, unknown>

function mapExpense(row: SupabaseRow): Expense {
    return { ...row, amount: Number(row.amount) } as unknown as Expense
}

export async function getExpenses(
    supabase: SupabaseClient,
    filters: ExpenseFilters = {},
): Promise<{ data: PaginatedResponse<Expense> | null; error: Error | null }> {
    try {
        const { category, start_date, end_date, page = 1, limit = 10 } = filters
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('expenses')
            .select('*', { count: 'exact' })
            .order('expense_date', { ascending: false })
            .range(from, to)

        if (category) query = query.eq('category', category)
        if (start_date) query = query.gte('expense_date', start_date)
        if (end_date) query = query.lte('expense_date', end_date)

        const { data, error, count } = await query
        if (error) return { data: null, error: new Error(error.message) }

        return {
            data: {
                data: (data ?? []).map(mapExpense),
                total: count ?? 0,
                page, limit,
                totalPages: Math.ceil((count ?? 0) / limit),
            },
            error: null,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function getExpenseById(
    supabase: SupabaseClient, id: number,
): Promise<{ data: Expense | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.from('expenses').select('*').eq('id', id).single()
        if (error || !data) return { data: null, error: new Error('Expense not found') }
        return { data: mapExpense(data), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createExpense(
    supabase: SupabaseClient, payload: ExpenseInsert,
): Promise<{ data: Expense | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.from('expenses').insert(payload).select().single()
        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: mapExpense(data), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updateExpense(
    supabase: SupabaseClient, id: number, payload: ExpenseUpdate,
): Promise<{ data: Expense | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()
        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: mapExpense(data), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deleteExpense(
    supabase: SupabaseClient, id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('expenses').delete().eq('id', id)
        return { error: error ? new Error(error.message) : null }
    } catch (err) {
        return { error: err as Error }
    }
}
