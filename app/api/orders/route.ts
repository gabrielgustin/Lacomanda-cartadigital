import { NextResponse } from 'next/server'
import { OrderError, createOrder } from '@/lib/orders'
import { orderSchema } from '@/lib/order-schema'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'desconocida'
  if (!rateLimit(`orders:${ip}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'Hiciste demasiados pedidos seguidos. Esperá unos minutos e intentá de nuevo.' }, { status: 429 })
  }

  const parsed = orderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Revisá los datos del pedido.' }, { status: 400 })

  try {
    const order = await createOrder(parsed.data)
    return NextResponse.json({ success: true, token: order.token })
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('createOrder', error)
    return NextResponse.json({ error: 'No pudimos guardar tu pedido. Probá de nuevo en un momento.' }, { status: 500 })
  }
}
