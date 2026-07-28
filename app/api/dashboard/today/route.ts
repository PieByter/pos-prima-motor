import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getUnreadCount } from '@/lib/services/notifications.service'

export async function GET() {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const admin = createAdminClient()
        const today = new Date().toISOString().slice(0, 10)

        // Today's completed sales
        const { count: transactionCount, error: countErr } = await admin
            .from('sales')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed')
            .gte('sale_date', today)
            .lte('sale_date', today)

        if (countErr) throw countErr

        // Today's total sales
        const { data: salesData } = await admin
            .from('sales')
            .select('total_amount')
            .eq('status', 'completed')
            .gte('sale_date', today)
            .lte('sale_date', today)

        const totalSales = (salesData ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)

        // Low stock count
        const { data: lowStock } = await admin
            .from('stock_summary')
            .select('item_id')
            .lte('current_stock', 5)

        // Unread notifications
        const { count: unreadCount } = await getUnreadCount(admin, user.id)

        return NextResponse.json({
            transactionCount: transactionCount ?? 0,
            totalSales,
            totalItems: 0,
            lowStockCount: lowStock?.length ?? 0,
            unreadNotifications: unreadCount ?? 0,
        })
    } catch (err) {
        console.error('Today summary error:', err)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
