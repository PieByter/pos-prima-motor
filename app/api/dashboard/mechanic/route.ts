import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

export async function GET() {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse

        const admin = createAdminClient()
        const today = new Date().toISOString().slice(0, 10)
        const userId = user.id

        // 1. Today's completed transactions by this mechanic
        const { data: todaySales, count: todayCount, error: countErr } = await admin
            .from('sales')
            .select('id, total_amount', { count: 'exact' })
            .eq('status', 'completed')
            .eq('mechanic_id', userId)
            .gte('sale_date', today)
            .lte('sale_date', today)

        if (countErr) throw countErr

        const todayTransactionCount = todayCount ?? 0
        const todayTotalSales = (todaySales ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)

        // 2. Today's service fees earned
        let todayServiceFees = 0
        const todaySaleIds = (todaySales ?? []).map((s) => s.id)
        if (todaySaleIds.length > 0) {
            const { data: details } = await admin
                .from('sale_details')
                .select('service_fee')
                .in('sale_id', todaySaleIds)

            todayServiceFees = (details ?? []).reduce((sum, d) => sum + Number(d.service_fee), 0)
        }

        // 3. This week's sales (Mon-Sun)
        const now = new Date()
        const dayOfWeek = now.getDay()
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const monday = new Date(now)
        monday.setDate(now.getDate() - diffToMonday)
        const mondayStr = monday.toISOString().slice(0, 10)

        const { data: weekSales } = await admin
            .from('sales')
            .select('id, total_amount')
            .eq('status', 'completed')
            .eq('mechanic_id', userId)
            .gte('sale_date', mondayStr)
            .lte('sale_date', today)

        const weekTransactionCount = (weekSales ?? []).length
        const weekTotalSales = (weekSales ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0)

        let weekServiceFees = 0
        const weekSaleIds = (weekSales ?? []).map((s) => s.id)
        if (weekSaleIds.length > 0) {
            const chunks: number[][] = []
            for (let i = 0; i < weekSaleIds.length; i += 300) {
                chunks.push(weekSaleIds.slice(i, i + 300))
            }
            for (const chunk of chunks) {
                const { data: weekDetails } = await admin
                    .from('sale_details')
                    .select('service_fee')
                    .in('sale_id', chunk)
                weekServiceFees += (weekDetails ?? []).reduce((sum, d) => sum + Number(d.service_fee), 0)
            }
        }

        // 4. Mechanic's profile (salary + commission pct)
        const { data: profile } = await admin
            .from('profiles')
            .select('weekly_salary, service_commission_pct')
            .eq('id', userId)
            .single()

        const weeklySalary = Number(profile?.weekly_salary) || 0
        const commissionPct = Number(profile?.service_commission_pct) || 0
        const weekCommission = weekServiceFees * (commissionPct / 100)
        const estimatedWeekEarnings = weeklySalary + weekCommission

        // 5. Low stock items (relevant for mechanic to know)
        const { data: lowStock } = await admin
            .from('stock_summary')
            .select('item_id')
            .lte('current_stock', 5)

        return NextResponse.json({
            today: {
                transactionCount: todayTransactionCount,
                totalSales: todayTotalSales,
                serviceFees: todayServiceFees,
            },
            week: {
                transactionCount: weekTransactionCount,
                totalSales: weekTotalSales,
                serviceFees: weekServiceFees,
                weekStart: mondayStr,
            },
            earnings: {
                weeklySalary,
                commissionPct,
                weekCommission,
                estimatedWeekEarnings,
            },
            lowStockCount: lowStock?.length ?? 0,
        })
    } catch (err) {
        console.error('Mechanic dashboard error:', err)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
