import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getCustomers, createCustomer } from '@/lib/services/customers.service'
import type { CustomerInsert } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')?.trim() ?? ''
    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 10)

    // Use admin client for reads — bypasses RLS on trusted server route
    const admin = createAdminClient()
    const { data, error } = await getCustomers(admin, { search, page, limit })

    if (error || !data) {
      console.error('Customers GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Customers GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const body = (await request.json()) as CustomerInsert

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 422 })
    }

    // Use admin client for writes — bypasses RLS safely on the server
    const admin = createAdminClient()
    const { data, error } = await createCustomer(admin, body)

    if (error || !data) {
      console.error('Customers POST failed:', error)
      return NextResponse.json(
        { error: error?.message ?? 'Failed to create customer' },
        { status: 400 },
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Customers POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
