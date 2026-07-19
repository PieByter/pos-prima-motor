import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getDiscounts, createDiscount } from '@/lib/services/discounts.service'

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const searchParams = request.nextUrl.searchParams

    const admin = createAdminClient()
    const { data, error } = await getDiscounts(admin, {
      search: searchParams.get('search') ?? undefined,
      is_active: searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    })

    if (error || !data) {
      console.error('Discounts GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch discounts' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Discounts GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { discount, itemIds } = await request.json()

    const admin = createAdminClient()
    const { data, error } = await createDiscount(admin, discount, itemIds ?? [])

    if (error || !data) {
      console.error('Discounts POST failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to create discount' }, { status: 400 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Discounts POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
