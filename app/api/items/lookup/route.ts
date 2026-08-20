import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getItemBySku } from '@/lib/services/items.service'

/**
 * Lookup item by exact SKU (barcode) + real-time stock.
 * Used by the cashier barcode scanner.
 */
export async function GET(request: NextRequest) {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const sku = request.nextUrl.searchParams.get('sku')?.trim()
        if (!sku) {
            return NextResponse.json({ error: 'sku query parameter is required' }, { status: 400 })
        }

        const admin = createAdminClient()
        const { data, error } = await getItemBySku(admin, sku)

        if (error || !data) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }
        return NextResponse.json(data)
    } catch (err) {
        console.error('Items lookup unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}