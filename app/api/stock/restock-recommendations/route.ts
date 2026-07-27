import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

type StockRow = {
    item_id: number
    name: string
    sku: string | null
    current_stock: number
}

type SaleDetailRow = {
    item_id: number
    quantity: number
}

type Urgency = 'critical' | 'high' | 'medium'

type Recommendation = {
    item_id: number
    name: string
    sku: string | null
    current_stock: number
    sold_30_days: number
    avg_daily: number
    days_until_empty: number
    recommended_qty: number
    urgency: Urgency
}

export async function GET() {
    try {
        const auth = await requireAuth()
        if (auth.errorResponse) return auth.errorResponse

        const admin = createAdminClient()

        // Get items with stock_summary where stock is low, with sales velocity
        const { data: stockData } = await admin
            .from('stock_summary')
            .select('item_id, name, sku, current_stock')
            .lte('current_stock', 10)
            .order('current_stock', { ascending: true })
            .limit(20)

        if (!stockData || stockData.length === 0) {
            return NextResponse.json([])
        }

        const rows = stockData as unknown as StockRow[]
        const itemIds = rows.map((s) => s.item_id)

        // Get sales velocity (last 30 days sales count per item)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const startStr = thirtyDaysAgo.toISOString().slice(0, 10)

        const { data: saleDetails } = await admin
            .from('sale_details')
            .select('item_id, quantity')
            .in('item_id', itemIds)
            .gte('created_at', startStr)

        const salesVelocity: Record<number, number> = {}
        for (const d of (saleDetails ?? []) as unknown as SaleDetailRow[]) {
            salesVelocity[d.item_id] = (salesVelocity[d.item_id] ?? 0) + d.quantity
        }

        const recommendations: Recommendation[] = rows.map((s) => {
            const sold30 = salesVelocity[s.item_id] ?? 0
            const avgDaily = Math.max(0.1, sold30 / 30)
            const daysUntilEmpty = avgDaily > 0 ? Math.floor(s.current_stock / avgDaily) : 999
            const recommendedQty = Math.max(
                Math.ceil(avgDaily * 14) - s.current_stock,
                5,
            )

            const urgency: Urgency =
                s.current_stock <= 2 ? 'critical' :
                    s.current_stock <= 5 ? 'high' :
                        'medium'

            return {
                item_id: s.item_id,
                name: s.name,
                sku: s.sku,
                current_stock: s.current_stock,
                sold_30_days: sold30,
                avg_daily: Math.round(avgDaily * 10) / 10,
                days_until_empty: daysUntilEmpty,
                recommended_qty: Math.max(0, recommendedQty),
                urgency,
            }
        })

        const urgencyOrder: Record<Urgency, number> = { critical: 0, high: 1, medium: 2 }
        recommendations.sort((a, b) => {
            const diff = urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
            if (diff !== 0) return diff
            return a.days_until_empty - b.days_until_empty
        })

        return NextResponse.json(recommendations)
    } catch (err) {
        console.error('Restock recommendations error:', err)
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
