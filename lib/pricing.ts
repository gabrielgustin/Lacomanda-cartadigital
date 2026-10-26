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

// Sin costo de envío en el cálculo: si el delivery se cobra, se acuerda por WhatsApp.
export function orderTotals(lines: PricedLine[], coupon?: CouponTerms | null) {
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const descuento = coupon ? couponDiscount(subtotal, coupon) : 0
  return { subtotal, descuento, total: round2(subtotal - descuento) }
}
