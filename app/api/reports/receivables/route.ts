import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import { getReceivablesReport } from '@/lib/services/reports.service'
import { notifyOverdueReceivables } from '@/lib/services/notification-triggers.service'

export async function GET() {
    try {
        const { user, errorResponse } = await requireAuth()
        if (errorResponse) return errorResponse
        void user

        const admin = createAdminClient()
        const { data, error } = await getReceivablesReport(admin)

        if (error || !data) {
            console.error('Receivables report GET failed:', error)
            return NextResponse.json({ error: 'Failed to fetch receivables report' }, { status: 500 })
        }

        // Notifikasi otomatis piutang jatuh tempo (fire-and-forget, deduplikasi per invoice)
        notifyOverdueReceivables(admin)
            .then((n) => { if (n > 0) console.log(`Created ${n} overdue receivable notification(s)`) })
            .catch((e) => console.error('Failed to notify overdue receivables:', e))

        return NextResponse.json(data)
    } catch (err) {
        console.error('Receivables report GET unexpected error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
