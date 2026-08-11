import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActivityLog, PaginatedResponse } from '@/lib/types/database'

type ActivityFilters = {
    limit?: number
    page?: number
    entity?: string
    action?: string
}

export async function getActivityLogs(
    supabase: SupabaseClient,
    filters: ActivityFilters = {},
): Promise<{ data: PaginatedResponse<ActivityLog> | null; error: Error | null }> {
    try {
        const { limit = 50, page = 1, entity, action } = filters
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('activity_logs')
            .select('*, profiles(name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to)

        if (entity) query = query.eq('entity', entity)
        if (action) query = query.eq('action', action)

        const { data, error, count } = await query
        if (error) return { data: null, error: new Error(error.message) }

        return {
            data: {
                data: (data ?? []) as ActivityLog[],
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
