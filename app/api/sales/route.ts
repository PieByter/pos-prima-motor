import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getSales, createSale, generateInvoiceNumber } from '@/lib/services/sales.service'
import { notifyLargeTransaction, notifyMechanicSaleCreated, checkAndNotifyLowStock } from '@/lib/services/notification-triggers.service'
import { earnPoints } from '@/lib/services/loyalty.service'

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const searchParams = request.nextUrl.searchParams

    const admin = createAdminClient()
    const { data, error } = await getSales(admin, {
      search: searchParams.get('search') ?? undefined,
      customer_id: searchParams.get('customer_id') ? Number(searchParams.get('customer_id')) : undefined,
      vehicle_id: searchParams.get('vehicle_id') ? Number(searchParams.get('vehicle_id')) : undefined,
      mechanic_id: searchParams.get('mechanic_id') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      sale_type: searchParams.get('sale_type') ?? undefined,
      payment_status: searchParams.get('payment_status') ?? undefined,
      start_date: searchParams.get('start_date') ?? undefined,
      end_date: searchParams.get('end_date') ?? undefined,
      page: Number(searchParams.get('page') ?? 1),
      limit: Number(searchParams.get('limit') ?? 10),
    })

    if (error || !data) {
      console.error('Sales GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Sales GET unexpected error:', err)
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

    const { data, error } = await createSale(admin, header, details)

    if (error || !data) {
      console.error('Sales POST failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to create sale' }, { status: 400 })
    }

    // ─── Fire notifications (fire-and-forget, don't block response) ───
    const sale = data as { id: number; invoice_number: string; total_amount: number; mechanic_id: string; customer?: { name?: string } }
    const totalServiceFees = (details ?? []).reduce((sum: number, d: { service_fee?: number }) => sum + (Number(d.service_fee) || 0), 0)

    // Notify mechanic that their sale was created
    notifyMechanicSaleCreated(
      sale.mechanic_id,
      sale.id,
      sale.invoice_number,
      Number(sale.total_amount),
      totalServiceFees,
    ).catch((e) => console.error('Failed to notify mechanic:', e))

    // Notify admin about large transaction
    notifyLargeTransaction(
      sale.id,
      sale.invoice_number,
      Number(sale.total_amount),
      sale.customer?.name ?? 'Walk-in',
    ).catch((e) => console.error('Failed to notify large tx:', e))

    // Earn loyalty points for the customer (1 poin per Rp 10.000 belanja)
    const loyaltyCustomerId = Number(header.customer_id)
    if (loyaltyCustomerId) {
      const earned = Math.max(1, Math.floor(Number(sale.total_amount) / 10000))
      earnPoints(admin, loyaltyCustomerId, earned, sale.invoice_number, user.id)
        .catch((e) => console.error('Failed to earn loyalty points:', e))
    }

    // Check low stock for each item in the sale
    for (const d of details ?? []) {
      if (!d.item_id) continue
      const { data: stockData } = await admin
        .from('stock_summary')
        .select('item_name, current_stock')
        .eq('item_id', d.item_id)
        .single()

      if (stockData) {
        checkAndNotifyLowStock(
          stockData.item_name,
          d.item_id,
          Number(stockData.current_stock),
        ).catch((e) => console.error('Failed to check low stock:', e))
      }
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Sales POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
