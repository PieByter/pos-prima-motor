import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getItemById, updateItem, deleteItem } from '@/lib/services/items.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse
  void user

  const { id } = await params
  const numericId = Number(id)
  if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await getItemById(admin, numericId)

  if (error || !data) return NextResponse.json({ error: 'Item not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 })

    const body = await request.json()
    const admin = createAdminClient()

    // Get old values for price history
    const { data: oldItem } = await getItemById(admin, numericId)

    const { data, error } = await updateItem(admin, numericId, body)

    if (error || !data) {
      console.error('Items PATCH failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to update item' }, { status: 400 })
    }

    // Log price changes to history
    if (oldItem) {
      const priceFields = ['purchase_price', 'selling_price', 'service_fee'] as const
      const priceChanges: Array<{ item_id: number; field: string; old_price: number; new_price: number; changed_by: string }> = []

      for (const field of priceFields) {
        const oldVal = Number((oldItem as Record<string, unknown>)[field] ?? 0)
        const newVal = Number((data as Record<string, unknown>)[field] ?? 0)
        if (oldVal !== newVal) {
          priceChanges.push({
            item_id: numericId,
            field,
            old_price: oldVal,
            new_price: newVal,
            changed_by: user.id,
          })
        }
      }

      if (priceChanges.length > 0) {
        await admin.from('price_history').insert(priceChanges)
      }
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Items PATCH unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await deleteItem(admin, numericId)

    if (error) {
      console.error('Items DELETE failed:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to delete item' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Item deleted' })
  } catch (err) {
    console.error('Items DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
