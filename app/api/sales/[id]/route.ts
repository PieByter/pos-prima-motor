import { getSaleById, updateSale, deleteSale } from '@/lib/services/sales.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { data, error } = await getSaleById(Number(id))

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data, error } = await updateSale(Number(id), body)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { error } = await deleteSale(Number(id))

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ message: 'Sale deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
