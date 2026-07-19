import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from '@/lib/services/customers.service'
import type { CustomerUpdate } from '@/lib/types/database'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse
  void user

  const { id } = await params
  const numericId = Number(id)

  if (isNaN(numericId)) {
    return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
  }

  // Use admin client for reads — bypasses RLS on trusted server route
  const admin = createAdminClient()
  const { data, error } = await getCustomerById(admin, numericId)

  if (error || !data) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const numericId = Number(id)

    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    const body = (await request.json()) as CustomerUpdate

    // Use admin client for the write
    const admin = createAdminClient()
    const { data, error } = await updateCustomer(admin, numericId, body)

    if (error || !data) {
      console.error('Customers PATCH failed:', error)
      return NextResponse.json(
        { error: error?.message ?? 'Failed to update customer' },
        { status: 400 },
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Customers PATCH unexpected error:', err)
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

    if (isNaN(numericId)) {
      return NextResponse.json({ error: 'Invalid customer ID' }, { status: 400 })
    }

    // Use admin client for the write
    const admin = createAdminClient()
    const { error } = await deleteCustomer(admin, numericId)

    if (error) {
      console.error('Customers DELETE failed:', error)
      return NextResponse.json(
        { error: error.message ?? 'Failed to delete customer' },
        { status: 400 },
      )
    }

    return NextResponse.json({ message: 'Customer deleted' })
  } catch (err) {
    console.error('Customers DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
