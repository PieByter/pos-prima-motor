import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getSuppliers, createSupplier } from '@/lib/services/suppliers.service'
import type { SupplierInsert } from '@/lib/types/database'

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
    const { data, error } = await getSuppliers(admin, { search, page, limit })

    if (error || !data) {
      console.error('Suppliers GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Suppliers GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const body = (await request.json()) as SupplierInsert

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 422 })
    }

    // Use admin client for writes — bypasses RLS safely on the server
    const admin = createAdminClient()
    const { data, error } = await createSupplier(admin, body)

    if (error || !data) {
      console.error('Suppliers POST failed:', error)
      return NextResponse.json(
        { error: error?.message ?? 'Failed to create supplier' },
        { status: 400 },
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Suppliers POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
