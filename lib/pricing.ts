import type { Localized } from '@/lib/menu-data'

// Sin dependencias de servidor: la pantalla muestra y el servidor cobra con estas mismas funciones.

export interface PricedLine {
  price: number
  quantity: number
}

// shortcut: sin cupones ni envío (el pedido es para retirar), total = subtotal; sumar discount y delivery cuando existan.
export function orderTotals(lines: PricedLine[]) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  return { subtotal, total: subtotal }
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
