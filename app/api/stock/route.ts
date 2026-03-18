import { createClient } from '@/lib/supabase/server'
import { getStockSummary } from '@/lib/services/stock.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const { data, error } = await getStockSummary(supabase, {
      search: searchParams.get('search') ?? undefined,
      stock_status: (searchParams.get('stock_status') as 'all' | 'low' | 'critical') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
