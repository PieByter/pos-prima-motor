import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getItemById, updateItem, deleteItem } from '@/lib/services/items.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 })

    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await updateItem(admin, numericId, body)

    if (error || !data) {
      console.error('Items PATCH failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to update item' }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Items PATCH unexpected error:', err)
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
