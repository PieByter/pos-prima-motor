import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStockSummary } from '@/lib/services/stock.service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const admin = createAdminClient()
    const { data, error } = await getStockSummary(admin, {
      search: searchParams.get('search') ?? undefined,
      stock_status: (searchParams.get('stock_status') as 'all' | 'low' | 'critical') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    })

    if (error || !data) {
      console.error('Stock GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Stock GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
