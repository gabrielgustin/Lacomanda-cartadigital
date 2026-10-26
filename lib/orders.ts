import type { Localized, MenuSection } from '@/lib/menu-data'
import type { OrderInput } from '@/lib/order-schema'
import { orderTotals } from '@/lib/pricing'
import { acceptsOrdersAt, couponValidOn, findCoupon, type OrderSettings } from '@/lib/settings'

export class OrderError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}

export interface OrderItem {
  productId: string
  nombre: Localized
  precioUnitario: number
  cantidad: number
}

const MAX_QUANTITY = 99

/**
 * Arma el pedido desde la carta y la configuración VIGENTES: precio, nombre, descuento y total
 * salen de acá, nunca del navegador. Función pura: el pedido no se guarda, termina en un mensaje de WhatsApp.
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
    formaEntrega: input.delivery === 'delivery' ? 'Delivery' : 'Retiro en el local',
    direccion: input.delivery === 'delivery' ? (input.address ?? null) : null,
    subtotal,
    descuento,
    cupon: coupon?.codigo ?? null,
    metodoPago: method?.nombre ?? null,
    total,
    items,
  }
}
