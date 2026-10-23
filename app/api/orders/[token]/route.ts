import { NextResponse } from 'next/server'
import { getOrderByToken, toPublicOrder } from '@/lib/orders'

// Lo consulta la página de seguimiento para mostrar el estado en vivo. El token es el secreto.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const order = await getOrderByToken((await params).token)
  if (!order) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(toPublicOrder(order), { headers: { 'Cache-Control': 'no-store' } })
}
