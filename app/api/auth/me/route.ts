import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/services/auth.service'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await getCurrentUser(supabase)

    if (error || !data) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
