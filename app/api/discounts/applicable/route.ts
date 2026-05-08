import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getApplicableDiscounts } from '@/lib/services/discounts.service'

export async function POST(request: NextRequest) {
  try {
    const { itemIds, totalAmount } = await request.json()

    const admin = createAdminClient()
    const { data, error } = await getApplicableDiscounts(admin, itemIds, totalAmount)

    if (error) {
      console.error('Applicable discounts failed:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Applicable discounts unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
