import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/auth'
import {
  getSuppliers,
  createSupplier,
  bulkDeleteSuppliers,
  replaceSupplierContacts,
  getSupplierById,
} from '@/lib/services/suppliers.service'
import type { SupplierInsert, SupplierContactInsert } from '@/lib/types/database'

type SupplierBody = SupplierInsert & { contacts?: Omit<SupplierContactInsert, 'supplier_id'>[] }

export async function GET(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')?.trim() ?? ''
    const page = Number(searchParams.get('page') ?? 1)
    const limit = Number(searchParams.get('limit') ?? 10)

    // Use admin client for reads — bypasses RLS on trusted server route
    const admin = createAdminClient()
    const { data, error } = await getSuppliers(admin, { search, page, limit })

    if (error || !data) {
      console.error('Suppliers GET failed:', error)
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (err) {
    console.error('Suppliers GET unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const body = (await request.json()) as SupplierBody

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 422 })
    }

    // Use admin client for writes — bypasses RLS safely on the server
    const admin = createAdminClient()
    const contacts = Array.isArray(body.contacts) ? body.contacts : undefined
    const supplierPayload = { ...body, contacts: undefined }

    const { data, error } = await createSupplier(admin, supplierPayload)

    if (error || !data) {
      console.error('Suppliers POST failed:', error)
      return NextResponse.json(
        { error: error?.message ?? 'Failed to create supplier' },
        { status: 400 },
      )
    }

    // Simpan kontak (jika dikirim)
    if (contacts && contacts.length > 0) {
      const { error: contactError } = await replaceSupplierContacts(admin, data.id, contacts)
      if (contactError) {
        console.error('Suppliers contacts insert failed:', contactError)
        return NextResponse.json({ error: contactError.message }, { status: 400 })
      }
    }

    const { data: withContacts } = await getSupplierById(admin, data.id)
    return NextResponse.json(withContacts ?? data, { status: 201 })
  } catch (err) {
    console.error('Suppliers POST unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, errorResponse } = await requireAuth()
    if (errorResponse) return errorResponse
    void user

    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { deleted, error } = await bulkDeleteSuppliers(admin, ids)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ deleted })
  } catch (err) {
    console.error('Suppliers bulk DELETE error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
