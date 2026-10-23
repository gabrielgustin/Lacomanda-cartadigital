import { describe, expect, it } from 'vitest'
import { ORDER_STATES, PROGRESS_STEPS, orderNumber, orderTotals } from '@/lib/pricing'

describe('orderTotals', () => {
  it('suma precio por cantidad', () => {
    expect(orderTotals([{ price: 8900, quantity: 2 }, { price: 5200, quantity: 1 }])).toEqual({ subtotal: 23000, total: 23000 })
  })

  it('un pedido vacío da cero', () => {
    expect(orderTotals([])).toEqual({ subtotal: 0, total: 0 })
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
