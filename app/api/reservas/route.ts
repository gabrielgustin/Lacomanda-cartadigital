import { NextResponse } from 'next/server'
import { crearReserva, fechaInvalida, reservaSchema } from '@/lib/reservas'
import { rateLimit } from '@/lib/rate-limit'

// La web pública solo puede CREAR reservas. Confirmarlas, cancelarlas o borrarlas es del backoffice.
export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'desconocida'
  if (!rateLimit(`reservas:${ip}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'Hiciste varias reservas seguidas. Esperá unos minutos e intentá de nuevo.' }, { status: 429 })
  }
  const parsed = reservaSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Revisá los datos de la reserva.' }, { status: 400 })
  const motivo = fechaInvalida(parsed.data.fecha)
  if (motivo) return NextResponse.json({ error: motivo }, { status: 400 })

  try {
    await crearReserva(parsed.data)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('reserva', error)
    return NextResponse.json({ error: 'No pudimos guardar la reserva.' }, { status: 500 })
  }
}
