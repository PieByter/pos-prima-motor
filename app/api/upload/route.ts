import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
    try {
        const auth = await requireAuth()
        if (auth.errorResponse) return auth.errorResponse

        const formData = await request.formData()
        const file = formData.get('file') as File | null

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 })
        }

        // Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
        }

        const admin = createAdminClient()

        // Generate unique filename
        const timestamp = Date.now()
        const ext = file.name.split('.').pop() ?? 'jpg'
        const fileName = `${timestamp}-${Math.random().toString(36).slice(2, 8)}.${ext}`

        const { data, error } = await admin.storage
            .from('item-pictures')
            .upload(`items/${fileName}`, file, {
                cacheControl: '3600',
                upsert: true,
                contentType: file.type,
            })

        if (error) {
            console.error('Upload error:', error)
            return NextResponse.json({ error: error.message || 'Failed to upload' }, { status: 500 })
        }

        const { data: { publicUrl } } = admin.storage
            .from('item-pictures')
            .getPublicUrl(data.path)

        return NextResponse.json({ url: publicUrl, path: data.path })
    } catch (err) {
        console.error('Upload error:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
