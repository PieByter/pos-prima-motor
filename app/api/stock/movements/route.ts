import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStockMovements } from '@/lib/services/stock.service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const admin = createAdminClient()
    const { data, error } = await getStockMovements(
      admin,
      searchParams.get('item_id') ? Number(searchParams.get('item_id')) : undefined,
      Number(searchParams.get('page') ?? 1),
      Number(searchParams.get('limit') ?? 20),
    )

    if (error || !data) {
      console.error('Stock movements GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Stock movements GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
