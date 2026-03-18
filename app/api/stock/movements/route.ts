import { createClient } from '@/lib/supabase/server'
import { getStockMovements } from '@/lib/services/stock.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const { data, error } = await getStockMovements(
      supabase,
      searchParams.get('item_id') ? Number(searchParams.get('item_id')) : undefined,
      Number(searchParams.get('page') ?? 1),
      Number(searchParams.get('limit') ?? 20),
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
