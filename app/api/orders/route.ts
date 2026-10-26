import { NextResponse } from 'next/server'
import { OrderError, buildOrder } from '@/lib/orders'
import { orderSchema } from '@/lib/order-schema'
import { rateLimit } from '@/lib/rate-limit'
import { loadStore } from '@/lib/store'
import { orderMessage, waLink } from '@/lib/whatsapp'

// El pedido no se guarda: el servidor valida, recalcula los precios y devuelve el enlace de WhatsApp con el mensaje armado.
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'desconocida'
  if (!rateLimit(`orders:${ip}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: 'Hiciste demasiados pedidos seguidos. Esperá unos minutos e intentá de nuevo.' }, { status: 429 })
  }

  const parsed = orderSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Revisá los datos del pedido.' }, { status: 400 })

  try {
    // Lectura estricta: si la base falla, el pedido falla; nunca se arma con precios de la carta base.
    const { sections, settings } = await loadStore()
    const order = buildOrder(parsed.data, sections, settings, new Date())
    const url = waLink(settings.negocio.whatsapp, orderMessage(order))
    if (!url) return NextResponse.json({ error: 'El local todavía no cargó su WhatsApp. Probá más tarde.' }, { status: 503 })
    return NextResponse.json({ success: true, url })
  } catch (error) {
    if (error instanceof OrderError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('order', error)
    return NextResponse.json({ error: 'No pudimos armar tu pedido. Probá de nuevo en un momento.' }, { status: 500 })
  }
}
