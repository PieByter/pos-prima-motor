import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth, requireAdmin, getUserRole } from '@/lib/auth'
import { getUserById, updateUser, deleteUser } from '@/lib/services/users.service'

type RouteParams = { params: Promise<{ id: string }> }

const SENSITIVE_FIELDS = [
  'role',
  'is_active',
  'weekly_salary',
  'service_commission_pct',
  'hire_date',
] as const

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { user, errorResponse } = await requireAuth()
  if (errorResponse) return errorResponse

  const { id } = await params

  // User hanya boleh lihat profil sendiri; admin boleh lihat semua
  const role = await getUserRole(user.id)
  if (role !== 'admin' && user.id !== id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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

    const { id } = await params
    const body = await request.json()

    const isSelf = user.id === id
    const role = await getUserRole(user.id)
    const isAdmin = role === 'admin'
    const touchesSensitive = SENSITIVE_FIELDS.some((f) => body[f] !== undefined)

    // Sensitif (role/gaji/status) → admin only.
    // Update user lain → admin only.
    // Mekanik hanya bisa update nama/foto/password milik sendiri.
    if (!isAdmin && (touchesSensitive || !isSelf)) {
      return NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 })
    }

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
    const { user, errorResponse } = await requireAdmin()
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
