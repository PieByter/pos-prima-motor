import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLowStockItems } from '@/lib/services/stock.service'
import { getBusinessSettings } from '@/lib/services/business-settings.service'

export async function GET(request: NextRequest) {
  try {
    const admin = createAdminClient()

    // Threshold dinamis dari pengaturan bisnis — query param optional override
    const { data: settings } = await getBusinessSettings(admin)
    const defaultThreshold = settings?.low_stock_threshold ?? 5
    const threshold = request.nextUrl.searchParams.get('threshold')
      ? Number(request.nextUrl.searchParams.get('threshold'))
      : defaultThreshold

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
