import { describe, expect, it } from 'vitest'
import { ORDER_STATES, PROGRESS_STEPS, couponDiscount, orderNumber, orderTotals } from '@/lib/pricing'

describe('orderTotals', () => {
  const lines = [{ price: 8900, quantity: 2 }, { price: 5200, quantity: 1 }]

  it('suma precio por cantidad; sin cupón no hay descuento', () => {
    expect(orderTotals(lines)).toEqual({ subtotal: 23000, descuento: 0, total: 23000 })
    expect(orderTotals(lines, null)).toEqual({ subtotal: 23000, descuento: 0, total: 23000 })
  })

  it('un pedido vacío da cero', () => {
    expect(orderTotals([])).toEqual({ subtotal: 0, descuento: 0, total: 0 })
  })

  it('aplica un cupón de porcentaje', () => {
    expect(orderTotals(lines, { tipo: 'porcentaje', valor: 10 })).toEqual({ subtotal: 23000, descuento: 2300, total: 20700 })
  })

  it('aplica un cupón de monto fijo', () => {
    expect(orderTotals(lines, { tipo: 'fijo', valor: 1500 })).toEqual({ subtotal: 23000, descuento: 1500, total: 21500 })
  })
})

describe('couponDiscount', () => {
  it('redondea a dos decimales', () => {
    expect(couponDiscount(1001, { tipo: 'porcentaje', valor: 12.5 })).toBe(125.13)
  })

  it('un cupón fijo mayor al subtotal descuenta solo el subtotal', () => {
    expect(orderTotals([{ price: 1000, quantity: 1 }], { tipo: 'fijo', valor: 5000 })).toEqual({ subtotal: 1000, descuento: 1000, total: 0 })
  })

  it('100 % deja el total en cero', () => {
    expect(orderTotals([{ price: 1000, quantity: 3 }], { tipo: 'porcentaje', valor: 100 }).total).toBe(0)
  })

  it('un valor negativo o un porcentaje fuera de rango no genera descuentos absurdos', () => {
    expect(couponDiscount(1000, { tipo: 'fijo', valor: -50 })).toBe(0)
    expect(couponDiscount(1000, { tipo: 'porcentaje', valor: 250 })).toBe(1000)
  })

  it('el descuento sobre un subtotal en cero es cero', () => {
    expect(couponDiscount(0, { tipo: 'porcentaje', valor: 50 })).toBe(0)
  })
})

describe('orderNumber', () => {
  it('rellena con ceros', () => {
    expect(orderNumber(12)).toBe('#00012')
    expect(orderNumber(123456)).toBe('#123456')
  })
})

describe('estados', () => {
  it('el progreso tiene cinco pasos y no incluye "cancelado"', () => {
    expect(PROGRESS_STEPS).toHaveLength(5)
    expect(PROGRESS_STEPS).not.toContain('cancelado')
    expect(ORDER_STATES).toContain('cancelado')
  })
})
