import { createClient } from '@/lib/supabase/server'
import { changeOwnPassword } from '@/lib/services/auth.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword) {
            return NextResponse.json(
                { error: 'Password saat ini wajib diisi.' },
                { status: 400 },
            )
        }

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password baru minimal 6 karakter.' },
                { status: 400 },
            )
        }

        const supabase = await createClient()
        const { error } = await changeOwnPassword(supabase, currentPassword, newPassword)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({
            message: 'Password berhasil diubah.',
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
