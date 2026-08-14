import type { SupabaseClient } from '@supabase/supabase-js'

export type BusinessSettings = {
    id: number
    shop_name: string
    shop_address: string | null
    shop_phone: string | null
    whatsapp_number: string | null
    tax_percent: number
    low_stock_threshold: number
    receipt_footer: string | null
    updated_by: string | null
    updated_at: string
}

export type BusinessSettingsInput = Partial<
    Omit<BusinessSettings, 'id' | 'updated_at'>
>

export async function getBusinessSettings(
    supabase: SupabaseClient,
): Promise<{ data: BusinessSettings | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('business_settings')
            .select('*')
            .order('id', { ascending: true })
            .limit(1)
            .maybeSingle()

        if (error) return { data: null, error: new Error(error.message) }

        // Jika belum ada baris → buat default
        if (!data) {
            const { data: created, error: createError } = await supabase
                .from('business_settings')
                .insert({ shop_name: 'Prima Motor' })
                .select()
                .single()

            if (createError || !created) return { data: null, error: new Error(createError?.message ?? 'Failed to init settings') }
            return { data: mapSettings(created), error: null }
        }

        return { data: mapSettings(data), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updateBusinessSettings(
    supabase: SupabaseClient,
    payload: BusinessSettingsInput,
): Promise<{ data: BusinessSettings | null; error: Error | null }> {
    try {
        // Pastikan baris ada
        await getBusinessSettings(supabase)

        const { data, error } = await supabase
            .from('business_settings')
            .update({ ...payload, updated_at: new Date().toISOString() })
            .order('id', { ascending: true })
            .limit(1)
            .select()
            .single()

        if (error || !data) return { data: null, error: new Error(error?.message ?? 'Failed to update settings') }
        return { data: mapSettings(data), error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

function mapSettings(row: Record<string, unknown>): BusinessSettings {
    return {
        ...row,
        tax_percent: Number(row.tax_percent ?? 11),
        low_stock_threshold: Number(row.low_stock_threshold ?? 5),
    } as unknown as BusinessSettings
}
