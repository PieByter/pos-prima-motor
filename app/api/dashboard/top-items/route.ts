import { createClient } from '@/lib/supabase/server'
import { getTopSellingItems } from '@/lib/services/dashboard.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const limit = Number(searchParams.get('limit') ?? 5)
    const start = searchParams.get('start') ?? undefined
    const end = searchParams.get('end') ?? undefined

    const dateRange = start && end ? { start, end } : undefined
    const { data, error } = await getTopSellingItems(supabase, limit, dateRange)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
