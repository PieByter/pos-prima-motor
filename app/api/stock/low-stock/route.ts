import { createClient } from '@/lib/supabase/server'
import { getLowStockItems } from '@/lib/services/stock.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const threshold = Number(request.nextUrl.searchParams.get('threshold') ?? 5)
    const { data, error } = await getLowStockItems(supabase, threshold)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
