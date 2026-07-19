import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getItems, createItem } from '@/lib/services/items.service'

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const searchParams = request.nextUrl.searchParams

    const admin = createAdminClient()
    const { data, error } = await getItems(admin, {
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    })

    if (error || !data) {
      console.error('Items GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Items GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const body = await request.json()

    const admin = createAdminClient()
    const { data, error } = await createItem(admin, body)

    if (error || !data) {
      console.error('Items POST failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to create item' }, { status: 400 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Items POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
