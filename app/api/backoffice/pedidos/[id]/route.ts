import { NextResponse } from 'next/server'
import { z } from 'zod'
import { isAdmin } from '@/lib/backoffice-auth'
import { updateOrderState } from '@/lib/orders'
import { ORDER_STATES } from '@/lib/pricing'

const idSchema = z.coerce.number().int().positive()
const bodySchema = z.object({ estado: z.enum(ORDER_STATES) })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Se exige JSON: un formulario de otro sitio no puede mandar este tipo de contenido sin permiso (CORS).
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return NextResponse.json({ error: 'Se esperaba JSON' }, { status: 415 })
  }

  const id = idSchema.safeParse((await params).id)
  const body = bodySchema.safeParse(await request.json().catch(() => null))
  if (!id.success || !body.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const order = await updateOrderState(id.data, body.data.estado)
  if (!order) return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 })
  return NextResponse.json(order)
}
