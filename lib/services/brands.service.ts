import type { SupabaseClient } from '@supabase/supabase-js'
import type { Brand, BrandInsert, BrandUpdate } from '@/lib/types/database'

export async function getBrands(
    supabase: SupabaseClient,
): Promise<{ data: Brand[] | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('name', { ascending: true })
        if (error) return { data: null, error: new Error(error.message) }
        return { data: data as Brand[], error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function createBrand(
    supabase: SupabaseClient, payload: BrandInsert,
): Promise<{ data: Brand | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.from('brands').insert(payload).select().single()
        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: data as Brand, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updateBrand(
    supabase: SupabaseClient, id: number, payload: BrandUpdate,
): Promise<{ data: Brand | null; error: Error | null }> {
    try {
        const { data, error } = await supabase.from('brands').update(payload).eq('id', id).select().single()
        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed') }
        return { data: data as Brand, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function deleteBrand(
    supabase: SupabaseClient, id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase.from('brands').delete().eq('id', id)
        return { error: error ? new Error(error.message) : null }
    } catch (err) {
        return { error: err as Error }
    }
}
