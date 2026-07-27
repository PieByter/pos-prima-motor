import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getPurchases, createPurchase, generateInvoiceNumber } from '@/lib/services/purchases.service'

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const searchParams = request.nextUrl.searchParams

    const admin = createAdminClient()
    const { data, error } = await getPurchases(admin, {
      search: searchParams.get('search') ?? undefined,
      supplier_id: searchParams.get('supplier_id') ? Number(searchParams.get('supplier_id')) : undefined,
      status: searchParams.get('status') ?? undefined,
      start_date: searchParams.get('start_date') ?? undefined,
      end_date: searchParams.get('end_date') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    })

    if (error || !data) {
      console.error('Purchases GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Purchases GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { header, details } = await request.json()

    // Inject created_by from authenticated user
    header.created_by = user.id

    const admin = createAdminClient()
    if (!header.invoice_number) {
      header.invoice_number = await generateInvoiceNumber(admin)
    }

    const { data, error } = await createPurchase(admin, header, details)

    if (error || !data) {
      console.error('Purchases POST failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to create purchase' }, { status: 400 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Purchases POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
