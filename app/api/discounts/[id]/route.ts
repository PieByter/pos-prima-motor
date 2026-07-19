import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getDiscountById, updateDiscount, deleteDiscount } from '@/lib/services/discounts.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse
  void user

  const { id } = await params
  const numericId = Number(id)
  if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await getDiscountById(admin, numericId)

  if (error || !data) return NextResponse.json({ error: 'Discount not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 })

    const { discount, itemIds } = await request.json()
    const admin = createAdminClient()
    const { data, error } = await updateDiscount(admin, numericId, discount, itemIds)

    if (error || !data) {
      console.error('Discounts PATCH failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to update discount' }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Discounts PATCH unexpected error:', err)
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
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid discount ID' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await deleteDiscount(admin, numericId)

    if (error) {
      console.error('Discounts DELETE failed:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to delete discount' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Discount deleted' })
  } catch (err) {
    console.error('Discounts DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
