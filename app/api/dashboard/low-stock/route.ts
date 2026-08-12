import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLowStockAlerts } from '@/lib/services/dashboard.service'
import { getBusinessSettings } from '@/lib/services/business-settings.service'

export async function GET() {
  try {
    const admin = createAdminClient()

    // Threshold dinamis dari pengaturan bisnis (default 5)
    const { data: settings } = await getBusinessSettings(admin)
    const threshold = settings?.low_stock_threshold ?? 5

    const { data, error } = await getLowStockAlerts(admin, threshold)

    if (error || !data) {
      console.error('Dashboard low-stock GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch low stock alerts' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Dashboard low-stock GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
