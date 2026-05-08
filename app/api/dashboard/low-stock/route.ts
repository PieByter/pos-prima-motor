import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getLowStockAlerts } from '@/lib/services/dashboard.service'

export async function GET() {
  try {
    const admin = createAdminClient()
    const { data, error } = await getLowStockAlerts(admin)

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
