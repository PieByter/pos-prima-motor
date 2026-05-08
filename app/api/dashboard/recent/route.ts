import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRecentTransactions } from '@/lib/services/dashboard.service'

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 5)

    const admin = createAdminClient()
    const { data, error } = await getRecentTransactions(admin, limit)

    if (error || !data) {
      console.error('Dashboard recent GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch recent transactions' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Dashboard recent GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
