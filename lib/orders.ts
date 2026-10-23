import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Localized, MenuSection } from '@/lib/menu-data'
import type { OrderInput } from '@/lib/order-schema'
import { orderTotals, type OrderState } from '@/lib/pricing'
import { DATA_DIR, getStore } from '@/lib/store'

export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

/** Cada renglón guarda nombre y precio como eran al comprar: editar la carta después no cambia el pedido. */
export interface OrderItem {
  productId: string
  nombre: Localized
  precioUnitario: number
  cantidad: number
}

export interface Order {
  id: number
  /** Enlace público de seguimiento. */
  token: string
  estado: OrderState
  clienteNombre: string
  clienteTelefono: string
  notas: string | null
  formaEntrega: string
  subtotal: number
  total: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

/** Lo que ve quien abre el enlace de seguimiento: sin teléfono ni token. */
export const toPublicOrder = ({ id, estado, clienteNombre, notas, formaEntrega, subtotal, total, items, createdAt }: Order) => ({
  id,
  estado,
  clienteNombre,
  notas,
  formaEntrega,
  subtotal,
  total,
  items,
  createdAt,
})
export type PublicOrder = ReturnType<typeof toPublicOrder>

export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const MAX_QUANTITY = 99

/**
 * Arma el pedido desde la carta VIGENTE: precio, nombre y total salen de acá,
 * nunca del navegador. Función pura para poder probarla sin tocar el disco.
 */
export function buildOrder(input: OrderInput, sections: MenuSection[]) {
  const available = new Map(
    sections
      .filter((section) => section.visible)
      .flatMap((section) => section.items.filter((item) => item.visible).map((item) => [item.id, item] as const)),
  )

  // Un mismo plato repetido en la petición se suma, con el tope por renglón.
  const quantities = new Map<string, number>()
  for (const { productId, quantity } of input.items) {
    quantities.set(productId, Math.min((quantities.get(productId) ?? 0) + quantity, MAX_QUANTITY))
  }

  const items: OrderItem[] = [...quantities].map(([productId, cantidad]) => {
    const product = available.get(productId)
    if (!product) throw new OrderError('Un plato de tu pedido ya no está disponible. Revisá la carta e intentá de nuevo.', 409)
    return { productId, nombre: product.name, precioUnitario: product.price, cantidad }
  })

  const { subtotal, total } = orderTotals(items.map((item) => ({ price: item.precioUnitario, quantity: item.cantidad })))

  return {
    clienteNombre: input.customer.name,
    clienteTelefono: input.customer.phone,
    notas: input.notes || null,
    formaEntrega: 'Para llevar',
    subtotal,
    total,
    items,
  }
}

// Persistencia en archivo, igual que la carta. Es lo único que hay que cambiar para pasar a una base.
// shortcut: en hosts de solo lectura (Vercel) no se puede guardar; migrar a Neon antes de publicar pedidos.
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json')

async function readOrders(): Promise<Order[]> {
  try {
    const raw = JSON.parse(await fs.readFile(ORDERS_FILE, 'utf8'))
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

// Las escrituras se encolan para que dos pedidos seguidos no se pisen ni repitan número.
let queue: Promise<unknown> = Promise.resolve()

export function createOrder(input: OrderInput): Promise<Order> {
  const run = async () => {
    const { sections } = await getStore()
    const data = buildOrder(input, sections)
    const orders = await readOrders()
    const now = new Date().toISOString()
    const order: Order = { ...data, id: (orders.at(-1)?.id ?? 0) + 1, token: randomUUID(), estado: 'nuevo', createdAt: now, updatedAt: now }

    await fs.mkdir(DATA_DIR, { recursive: true })
    const tmp = `${ORDERS_FILE}.${process.pid}.tmp`
    await fs.writeFile(tmp, JSON.stringify([...orders, order], null, 2))
    await fs.rename(tmp, ORDERS_FILE)
    return order
  }
  const next = queue.then(run, run)
  queue = next.catch(() => {})
  return next
}

export async function getOrderByToken(token: string) {
  if (!isUuid(token)) return null
  return (await readOrders()).find((order) => order.token === token) ?? null
}
