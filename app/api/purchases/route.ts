import { createClient } from '@/lib/supabase/server'
import { getPurchases, createPurchase, generateInvoiceNumber } from '@/lib/services/purchases.service'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const { data, error } = await getPurchases(supabase, {
      search: searchParams.get('search') ?? undefined,
      supplier_id: searchParams.get('supplier_id') ? Number(searchParams.get('supplier_id')) : undefined,
      status: searchParams.get('status') ?? undefined,
      start_date: searchParams.get('start_date') ?? undefined,
      end_date: searchParams.get('end_date') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { header, details } = await request.json()

    // Auto-generate invoice number if not provided
    if (!header.invoice_number) {
      header.invoice_number = await generateInvoiceNumber(supabase)
    }

    const { data, error } = await createPurchase(supabase, header, details)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
