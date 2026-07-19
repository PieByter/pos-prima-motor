import { adminResetPassword } from '@/lib/services/auth.service'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const { email, newPassword } = await request.json()

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 },
            )
        }

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password minimal 6 karakter.' },
                { status: 400 },
            )
        }

        const { error } = await adminResetPassword(email, newPassword)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({
            message: 'Password berhasil direset. Silakan login dengan password baru Anda.',
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
