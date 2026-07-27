import type { SupabaseClient } from '@supabase/supabase-js'
import type { Category, CategoryInsert, CategoryUpdate } from '@/lib/types/database'

export async function getCategories(
    supabase: SupabaseClient,
): Promise<{ data: Category[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true })
        if (error) return { data: null, error: new Error(error.message) }
        return { data: data as Category[], error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createCategory(
    supabase: SupabaseClient,
    payload: CategoryInsert,
): Promise<{ data: Category | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.from('categories').insert(payload).select().single()
        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: data as Category, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updateCategory(
    supabase: SupabaseClient, id: number, payload: CategoryUpdate,
): Promise<{ data: Category | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.from('categories').update(payload).eq('id', id).select().single()
        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: data as Category, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deleteCategory(
    supabase: SupabaseClient, id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('categories').delete().eq('id', id)
        return { error: error ? new Error(error.message) : null }
    } catch (err) {
        return { error: err as Error }
    }
}
