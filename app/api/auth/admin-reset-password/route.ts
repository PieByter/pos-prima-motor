import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const { userId, newPassword } = await request.json()

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required.' },
                { status: 400 },
            )
        }

        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Password minimal 6 karakter.' },
                { status: 400 },
            )
        }

        const admin = createAdminClient()
        const { error } = await admin.auth.admin.updateUserById(userId, {
            password: newPassword,
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json({
            message: 'Password berhasil direset.',
        })
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
