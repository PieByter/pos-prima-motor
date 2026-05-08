import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSalesChart } from '@/lib/services/dashboard.service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    if (!start || !end) {
      return NextResponse.json({ error: 'start and end date params required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error } = await getSalesChart(admin, { start, end })

    if (error) {
      console.error('Dashboard chart GET failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Dashboard chart GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
