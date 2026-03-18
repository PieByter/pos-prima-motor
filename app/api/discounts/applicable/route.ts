import { createClient } from '@/lib/supabase/server'
import { getApplicableDiscounts } from '@/lib/services/discounts.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { itemIds, totalAmount } = await request.json()

    const { data, error } = await getApplicableDiscounts(supabase, itemIds, totalAmount)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
