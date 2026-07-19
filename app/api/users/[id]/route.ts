import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getUserById, updateUser, deleteUser } from '@/lib/services/users.service'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse
  void user

  const { id } = await params

  const admin = createAdminClient()
  const { data, error } = await getUserById(admin, id)

  if (error || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params
    const body = await request.json()

    const admin = createAdminClient()
    const { data, error } = await updateUser(admin, id, body)

    if (error || !data) {
      console.error('Users PATCH failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to update user' }, { status: 400 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Users PATCH unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { id } = await params

    const admin = createAdminClient()
    const { error } = await deleteUser(admin, id)

    if (error) {
      console.error('Users DELETE failed:', error)
      return NextResponse.json({ error: error.message ?? 'Failed to delete user' }, { status: 400 })
    }
    return NextResponse.json({ message: 'User deleted' })
  } catch (err) {
    console.error('Users DELETE unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
