import { NextResponse } from 'next/server'
import { isAdmin } from '@/lib/backoffice-auth'
import { listOrders } from '@/lib/orders'

// Lo consulta la pantalla de pedidos del backoffice para refrescarse. Solo con sesión.
export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await listOrders(200), { headers: { 'Cache-Control': 'no-store' } })
}
