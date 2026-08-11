import type { SupabaseClient } from '@supabase/supabase-js'
import type {
    WarrantyClaim,
    WarrantyClaimInsert,
    WarrantyClaimUpdate,
    WarrantyClaimWithDetails,
    PaginatedResponse,
} from '@/lib/types/database'

type WarrantyClaimFilters = {
    status?: 'pending' | 'approved' | 'rejected' | 'completed'
    page?: number
    limit?: number
}

export async function getWarrantyClaims(
    supabase: SupabaseClient,
    filters: WarrantyClaimFilters = {},
): Promise<{ data: PaginatedResponse<WarrantyClaimWithDetails> | null; error: Error | null }> {
    try {
        const { status, page = 1, limit = 10 } = filters
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('warranty_claims')
            .select(
                '*, items(id, name, sku), sale_details!warranty_claims_sale_detail_id_sale_details_id_fk(id, sale_id, item_id, quantity, sales(id, invoice_number, sale_date, customers(id, name, phone)))',
                { count: 'exact' },
            )
            .order('claim_date', { ascending: false })
            .range(from, to)

        if (status) {
            query = query.eq('status', status)
        }

        const { data, error, count } = await query

        if (error) return { data: null, error: new Error(error.message) }

        const mapped = (data ?? []).map((r) => ({
            ...r,
            item: r.items ?? null,
            sale_detail: r.sale_details ?? null,
            sale: (r.sale_details as unknown as { sales?: unknown })?.sales ?? null,
            items: undefined,
            sale_details: undefined,
        }))

        return {
            data: {
                data: mapped as WarrantyClaimWithDetails[],
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

export async function createWarrantyClaim(
    supabase: SupabaseClient,
    data: WarrantyClaimInsert,
): Promise<{ data: WarrantyClaim | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('warranty_claims')
            .insert({
                ...data,
                description: data.description.trim(),
                cost: String(data.cost ?? '0'),
                notes: data.notes?.trim() ? data.notes.trim() : null,
            })
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error(error?.message ?? 'Failed to create claim') }
        return { data: row as WarrantyClaim, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

export async function updateWarrantyClaim(
    supabase: SupabaseClient,
    id: number,
    data: WarrantyClaimUpdate,
): Promise<{ data: WarrantyClaim | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('warranty_claims')
            .update({ ...data, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single()

        if (error || !row) return { data: null, error: new Error('Claim not found') }
        return { data: row as WarrantyClaim, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}
