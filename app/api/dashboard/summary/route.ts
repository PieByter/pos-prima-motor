import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getSummaryCards } from '@/lib/services/dashboard.service'

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const searchParams = request.nextUrl.searchParams
    const start = searchParams.get('start') ?? undefined
    const end = searchParams.get('end') ?? undefined

    const dateRange = start && end ? { start, end } : undefined

    const admin = createAdminClient()
    const { data, error } = await getSummaryCards(admin, dateRange)

    if (error || !data) {
      console.error('Dashboard summary GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Dashboard summary GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
