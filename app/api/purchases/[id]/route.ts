import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getPurchaseById, updatePurchase, deletePurchase } from '@/lib/services/purchases.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse
  void user

  const { id } = await params
  const numericId = Number(id)
  if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await getPurchaseById(admin, numericId)

  if (error || !data) return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })

    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await updatePurchase(admin, numericId, body)

    if (error || !data) {
      console.error('Purchases PATCH failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to update purchase' }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Purchases PATCH unexpected error:', err)
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
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid purchase ID' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await deletePurchase(admin, numericId)

    if (error) {
      console.error('Purchases DELETE failed:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to delete purchase' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Purchase deleted' })
  } catch (err) {
    console.error('Purchases DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
