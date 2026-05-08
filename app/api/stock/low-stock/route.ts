import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLowStockItems } from '@/lib/services/stock.service'

export async function GET(request: NextRequest) {
  try {
    const threshold = Number(request.nextUrl.searchParams.get('threshold') ?? 5)

    const admin = createAdminClient()
    const { data, error } = await getLowStockItems(admin, threshold)

    if (error || !data) {
      console.error('Stock low-stock GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch low stock items' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Stock low-stock GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
