import { createClient } from '@/lib/supabase/server'
import { signUp } from '@/lib/services/auth.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, dan nama wajib diisi' },
        { status: 400 },
      )
    }

    // ⚠️ Keamanan: pendaftaran publik SELALU jadi mekanik.
    // Role admin hanya bisa dibuat oleh admin lain via /api/users (admin-only).
    const role = 'mekanik' as const

    const supabase = await createClient()
    const { data, error } = await signUp(supabase, email, password, { name, role })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
