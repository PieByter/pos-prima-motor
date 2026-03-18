import { createClient } from '@/lib/supabase/server'
import { getRecentTransactions } from '@/lib/services/dashboard.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const limit = Number(request.nextUrl.searchParams.get('limit') ?? 5)
    const { data, error } = await getRecentTransactions(supabase, limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
