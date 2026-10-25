import type { Localized } from '@/lib/menu-data'

// Sin dependencias de servidor: la pantalla muestra y el servidor cobra con estas mismas funciones.

export interface PricedLine {
  price: number
  quantity: number
}

export interface CouponTerms {
  tipo: 'porcentaje' | 'fijo'
  valor: number
}

const round2 = (amount: number) => Math.round(amount * 100) / 100

/** Descuento del cupón: nunca negativo ni mayor al subtotal, redondeado a centavos. */
export function couponDiscount(subtotal: number, coupon: CouponTerms) {
  const raw = coupon.tipo === 'porcentaje' ? (subtotal * coupon.valor) / 100 : coupon.valor
  return Math.min(subtotal, Math.max(0, round2(raw)))
}

// Sin costo de envío: todos los pedidos son para retirar en el local.
export function orderTotals(lines: PricedLine[], coupon?: CouponTerms | null) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const descuento = coupon ? couponDiscount(subtotal, coupon) : 0
  return { subtotal, descuento, total: round2(subtotal - descuento) }
}

export const orderNumber = (id: number) => `#${String(id).padStart(5, '0')}`

export const ORDER_STATES = ['nuevo', 'confirmado', 'preparando', 'listo', 'entregado', 'cancelado'] as const
export type OrderState = (typeof ORDER_STATES)[number]

export const STATE_LABELS: Record<OrderState, Localized> = {
  nuevo: { es: 'Recibido', en: 'Received' },
  confirmado: { es: 'Confirmado', en: 'Confirmed' },
  preparando: { es: 'En preparación', en: 'Preparing' },
  listo: { es: 'Listo', en: 'Ready' },
  entregado: { es: 'Entregado', en: 'Delivered' },
  cancelado: { es: 'Cancelado', en: 'Cancelled' },
}

/** Los cinco pasos de la barra de progreso; "cancelado" queda fuera. */
export const PROGRESS_STEPS = ORDER_STATES.slice(0, 5)
