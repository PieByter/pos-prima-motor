import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth'
import { deleteVehicleDocument } from '@/lib/services/vehicle-documents.service'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { user, errorResponse } = await requireAdmin()
        if (errorResponse) return errorResponse
        void user

        const { id } = await params
        const admin = createAdminClient()
        const { error } = await deleteVehicleDocument(admin, Number(id))

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }
        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Vehicle document DELETE error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
