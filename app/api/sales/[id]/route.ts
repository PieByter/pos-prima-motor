import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSaleById, updateSale, deleteSale } from '@/lib/services/sales.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const numericId = Number(id)
  if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await getSaleById(admin, numericId)

  if (error || !data) return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 })

    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await updateSale(admin, numericId, body)

    if (error || !data) {
      console.error('Sales PATCH failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to update sale' }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Sales PATCH unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid sale ID' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await deleteSale(admin, numericId)

    if (error) {
      console.error('Sales DELETE failed:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to delete sale' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Sale deleted' })
  } catch (err) {
    console.error('Sales DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
