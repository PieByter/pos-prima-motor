import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getUsers, createUser } from '@/lib/services/users.service'

export async function GET() {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const admin = createAdminClient()
    const { data, error } = await getUsers(admin)

    if (error || !data) {
      console.error('Users GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Users GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { email, password, name, role } = await request.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 },
      )
    }

    const admin = createAdminClient()
    const { data, error } = await createUser(admin, email, password, name, role)

    if (error || !data) {
      console.error('Users POST failed:', error)
      return NextResponse.json({ error: error?.message ?? 'Failed to create user' }, { status: 400 })
    }
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('Users POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
