import type { SupabaseClient } from '@supabase/supabase-js'
import type { Notification, NotificationInsert, NotificationUpdate } from '@/lib/types/notifications'

export type NotificationResult = {
    data: Notification[] | null
    error: Error | null
    totalUnread?: number
}

/**
 * Get notifications for a user, with pagination.
 */
export async function getNotifications(
    supabase: SupabaseClient,
    userId: string,
    options?: { page?: number; limit?: number; unreadOnly?: boolean },
): Promise<NotificationResult> {
    try {
        const page = options?.page ?? 1
        const limit = options?.limit ?? 20
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(from, to)

        if (options?.unreadOnly) {
            query = query.eq('is_read', false)
        }

        const { data, error, count } = await query

        if (error) return { data: null, error: new Error(error.message) }

        // Also count unread
        const { count: unreadCount } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)

        return {
            data: (data ?? []) as Notification[],
            error: null,
            totalUnread: unreadCount ?? 0,
        }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/**
 * Get unread notification count for badge.
 */
export async function getUnreadCount(
    supabase: SupabaseClient,
    userId: string,
): Promise<{ count: number; error: Error | null }> {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false)

        if (error) return { count: 0, error: new Error(error.message) }
        return { count: count ?? 0, error: null }
    } catch (err) {
        return { count: 0, error: err as Error }
    }
}

/**
 * Create a new notification.
 */
export async function createNotification(
    supabase: SupabaseClient,
    data: NotificationInsert,
): Promise<{ data: Notification | null; error: Error | null }> {
    try {
        const { data: row, error } = await supabase
            .from('notifications')
            .insert(data)
            .select()
            .single()

        if (error) return { data: null, error: new Error(error.message) }
        return { data: row as Notification, error: null }
    } catch (err) {
        return { data: null, error: err as Error }
    }
}

/**
 * Mark one or all notifications as read.
 */
export async function markAsRead(
    supabase: SupabaseClient,
    userId: string,
    notificationId?: number,
): Promise<{ error: Error | null }> {
    try {
        let query = supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)

        if (notificationId) {
            query = query.eq('id', notificationId)
        }

        const { error } = await query
        if (error) return { error: new Error(error.message) }
        return { error: null }
    } catch (err) {
        return { error: err as Error }
    }
}

/**
 * Delete a notification.
 */
export async function deleteNotification(
    supabase: SupabaseClient,
    id: number,
): Promise<{ error: Error | null }> {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id)

        if (error) return { error: new Error(error.message) }
        return { error: null }
    } catch (err) {
        return { error: err as Error }
    }
}
