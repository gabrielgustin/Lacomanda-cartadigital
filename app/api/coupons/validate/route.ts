import { NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'
import { couponValidOn, findCoupon } from '@/lib/settings'
import { getStore } from '@/lib/store'

const bodySchema = z.object({ code: z.string().trim().min(1).max(30) })

// Solo confirma si UN código es válido y devuelve sus condiciones para mostrar el descuento orientativo.
// No existe ninguna ruta que liste cupones; inexistente, vencido o inactivo responden igual para no poder enumerarlos.
// El total real lo vuelve a calcular el servidor al crear el pedido.
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'desconocida'
  if (!rateLimit(`coupons:${ip}`, 12, 10 * 60_000)) {
    return NextResponse.json({ error: 'Probaste demasiados cupones. Esperá unos minutos.' }, { status: 429 })
  }

  const body = bodySchema.safeParse(await request.json().catch(() => null))
  const invalid = NextResponse.json({ error: 'El cupón no es válido o está vencido.' }, { status: 400 })
  if (!body.success) return invalid

  const { settings } = await getStore()
  const coupon = findCoupon(settings, body.data.code)
  if (!coupon || !couponValidOn(coupon, new Date())) return invalid

  return NextResponse.json({ codigo: coupon.codigo, tipo: coupon.tipo, valor: coupon.valor })
}
