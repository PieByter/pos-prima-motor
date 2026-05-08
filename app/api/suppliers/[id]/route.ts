import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSupplierById, updateSupplier, deleteSupplier } from '@/lib/services/suppliers.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const numericId = Number(id)

  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await getSupplierById(admin, numericId)

  if (error || !data) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const numericId = Number(id)
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 })

    const body = await request.json()
    const admin = createAdminClient()
    const { data, error } = await updateSupplier(admin, numericId, body)

    if (error || !data) {
      console.error('Suppliers PATCH failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to update supplier' }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Suppliers PATCH unexpected error:', err)
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
    if (isNaN(numericId)) return NextResponse.json({ error: 'Invalid supplier ID' }, { status: 400 })

    const admin = createAdminClient()
    const { error } = await deleteSupplier(admin, numericId)

    if (error) {
      console.error('Suppliers DELETE failed:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to delete supplier' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Supplier deleted' })
  } catch (err) {
    console.error('Suppliers DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
