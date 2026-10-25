import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Localized, MenuSection } from '@/lib/menu-data'
import type { OrderInput } from '@/lib/order-schema'
import { orderTotals, type OrderState } from '@/lib/pricing'
import { acceptsOrdersAt, couponValidOn, findCoupon, type OrderSettings } from '@/lib/settings'
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
  /** 0 si no se aplicó cupón. */
  descuento: number
  /** Código del cupón aplicado. */
  cupon: string | null
  /** Se guarda el NOMBRE del medio de pago (no el id): el pedido no cambia si después se renombra. */
  metodoPago: string | null
  total: number
  items: OrderItem[]
  createdAt: string
  updatedAt: string
}

/** Lo que ve quien abre el enlace de seguimiento: sin teléfono ni token. */
export const toPublicOrder = ({ id, estado, clienteNombre, notas, formaEntrega, subtotal, descuento, cupon, metodoPago, total, items, createdAt }: Order) => ({
  id,
  estado,
  clienteNombre,
  notas,
  formaEntrega,
  subtotal,
  descuento,
  cupon,
  metodoPago,
  total,
  items,
  createdAt,
})
export type PublicOrder = ReturnType<typeof toPublicOrder>

export const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

const MAX_QUANTITY = 99

/**
 * Arma el pedido desde la carta y la configuración VIGENTES: precio, nombre, descuento y total
 * salen de acá, nunca del navegador. Función pura para poder probarla sin tocar el disco.
 */
export function buildOrder(input: OrderInput, sections: MenuSection[], settings: OrderSettings, now: Date) {
  if (!acceptsOrdersAt(settings, now)) {
    throw new OrderError('El local está cerrado y no toma pedidos en este momento.', 409)
  }

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

  // Con medios de pago activos, hay que elegir uno de ellos; sin ninguno activo, no se pide.
  const activeMethods = settings.metodosPago.filter((method) => method.activo)
  const method = activeMethods.find((candidate) => candidate.id === input.paymentMethodId)
  if (activeMethods.length > 0 && !method) throw new OrderError('Elegí un medio de pago válido.', 400)

  let coupon = null
  if (input.coupon) {
    coupon = findCoupon(settings, input.coupon) ?? null
    if (!coupon || !couponValidOn(coupon, now)) throw new OrderError('El cupón no es válido o está vencido.', 400)
  }

  const { subtotal, descuento, total } = orderTotals(
    items.map((item) => ({ price: item.precioUnitario, quantity: item.cantidad })),
    coupon,
  )

  return {
    clienteNombre: input.customer.name,
    clienteTelefono: input.customer.phone,
    notas: input.notes || null,
    formaEntrega: 'Para llevar',
    subtotal,
    descuento,
    cupon: coupon?.codigo ?? null,
    metodoPago: method?.nombre ?? null,
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
    if (!Array.isArray(raw)) return []
    // Los pedidos guardados antes de existir cupones y medios de pago no tienen esos campos.
    return raw.map((order) => ({ ...order, descuento: order.descuento ?? 0, cupon: order.cupon ?? null, metodoPago: order.metodoPago ?? null }))
  } catch {
    return []
  }
}

async function writeOrders(orders: Order[]) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  const tmp = `${ORDERS_FILE}.${process.pid}.tmp`
  await fs.writeFile(tmp, JSON.stringify(orders, null, 2))
  await fs.rename(tmp, ORDERS_FILE)
}

// Todas las escrituras (pedido nuevo, cambio de estado) pasan por una sola cola: así un cambio
// de estado no pisa un pedido recién creado ni se repiten números.
let queue: Promise<unknown> = Promise.resolve()

function withOrders<T>(mutate: (orders: Order[]) => T | Promise<T>): Promise<T> {
  const run = async () => {
    const orders = await readOrders()
    const result = await mutate(orders)
    await writeOrders(orders)
    return result
  }
  const next = queue.then(run, run)
  queue = next.catch(() => {})
  return next
}

export function createOrder(input: OrderInput): Promise<Order> {
  return withOrders(async (orders) => {
    const { sections, settings } = await getStore()
    const now = new Date()
    const order: Order = {
      ...buildOrder(input, sections, settings, now),
      id: (orders.at(-1)?.id ?? 0) + 1,
      token: randomUUID(),
      estado: 'nuevo',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    }
    orders.push(order)
    return order
  })
}

export function updateOrderState(id: number, estado: OrderState): Promise<Order | null> {
  return withOrders((orders) => {
    const order = orders.find((candidate) => candidate.id === id)
    if (!order) return null
    order.estado = estado
    order.updatedAt = new Date().toISOString()
    return order
  })
}

export async function getOrderByToken(token: string) {
  if (!isUuid(token)) return null
  return (await readOrders()).find((order) => order.token === token) ?? null
}

// shortcut: lee el archivo entero en cada consulta; paginar y contar en SQL al pasar a Neon.
export async function listOrders(limit = 200) {
  return (await readOrders()).sort((a, b) => b.id - a.id).slice(0, limit)
}

export async function countOrders(estado: OrderState) {
  return (await readOrders()).filter((order) => order.estado === estado).length
}
