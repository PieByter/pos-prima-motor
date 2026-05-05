import { getDiscountById, updateDiscount, deleteDiscount } from '@/lib/services/discounts.service'
import { NextRequest, NextResponse } from 'next/server'

type RouteParams = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { data, error } = await getDiscountById(Number(id))

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { discount, itemIds } = await request.json()

    const { data, error } = await updateDiscount(Number(id), discount, itemIds)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const { error } = await deleteDiscount(Number(id))

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ message: 'Discount deleted' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
