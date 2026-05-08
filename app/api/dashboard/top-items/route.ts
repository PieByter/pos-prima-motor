import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTopSellingItems } from '@/lib/services/dashboard.service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number(searchParams.get('limit') ?? 5)
    const start = searchParams.get('start') ?? undefined
    const end = searchParams.get('end') ?? undefined

    const dateRange = start && end ? { start, end } : undefined

    const admin = createAdminClient()
    const { data, error } = await getTopSellingItems(admin, limit, dateRange)

    if (error) {
      console.error('Dashboard top-items GET failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Dashboard top-items GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
