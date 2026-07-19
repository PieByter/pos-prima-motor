import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getNotifications, getUnreadCount, markAsRead } from '@/lib/services/notifications.service'

export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const searchParams = request.nextUrl.searchParams
        const page = Number(searchParams.get('page') ?? 1)
        const limit = Number(searchParams.get('limit') ?? 20)
        const unreadOnly = searchParams.get('unread_only') === 'true'

        const supabase = await createClient()
        const admin = createAdminClient()
        const { data, error, totalUnread } = await getNotifications(admin, user.id, {
            page,
            limit,
            unreadOnly,
        })

        if (error || !data) {
            return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
        }

        return NextResponse.json({ data, totalUnread })
    } catch (err) {
        console.error('Notifications GET error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const { notificationId } = await request.json()

        const admin = createAdminClient()
        const { error } = await markAsRead(admin, user.id, notificationId ?? undefined)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({ message: 'Notification marked as read' })
    } catch (err) {
        console.error('Notifications PATCH error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
