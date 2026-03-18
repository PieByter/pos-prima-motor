import { createClient } from '@/lib/supabase/server'
import { getLowStockAlerts } from '@/lib/services/dashboard.service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await getLowStockAlerts(supabase)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
