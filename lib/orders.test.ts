import { describe, expect, it } from 'vitest'
import type { MenuItem, MenuSection } from '@/lib/menu-data'
import { OrderError, buildOrder, isUuid } from '@/lib/orders'
import { orderSchema } from '@/lib/order-schema'

const item = (id: string, price: number, visible = true): MenuItem => ({
  id,
  sectionId: 's1',
  name: { es: id, en: id },
  description: { es: '', en: '' },
  price,
  visible,
})

const section = (items: MenuItem[], visible = true): MenuSection => ({
  id: 's1',
  label: { es: 'S', en: 'S' },
  title: { es: 'S', en: 'S' },
  eyebrow: { es: '', en: '' },
  image: '/x.png',
  icon: 'utensils',
  visible,
  items,
})

const customer = { name: 'Ana', phone: '351 555-1234' }
const sections = [section([item('a', 1000), item('b', 2500), item('oculto', 999, false)])]

describe('buildOrder', () => {
  it('recalcula precios desde la carta e ignora los que mande el navegador', () => {
    // El esquema descarta cualquier campo que no sea id y cantidad, así que "price" nunca llega.
    const input = orderSchema.parse({ customer, items: [{ productId: 'a', quantity: 2, price: 1, total: 1 }], total: 1 })
    const order = buildOrder(input, sections)
    expect(order.items[0].precioUnitario).toBe(1000)
    expect(order.subtotal).toBe(2000)
    expect(order.total).toBe(2000)
  })

  it('suma un mismo plato repetido y respeta el tope de 99', () => {
    const input = orderSchema.parse({ customer, items: [{ productId: 'a', quantity: 60 }, { productId: 'a', quantity: 60 }] })
    expect(buildOrder(input, sections).items).toEqual([expect.objectContaining({ productId: 'a', cantidad: 99 })])
  })

  it('rechaza un plato oculto', () => {
    const input = orderSchema.parse({ customer, items: [{ productId: 'oculto', quantity: 1 }] })
    expect(() => buildOrder(input, sections)).toThrow(OrderError)
  })

  it('rechaza un plato inexistente y uno de una categoría oculta', () => {
    expect(() => buildOrder(orderSchema.parse({ customer, items: [{ productId: 'nada', quantity: 1 }] }), sections)).toThrow(OrderError)
    const hiddenSection = [section([item('a', 1000)], false)]
    expect(() => buildOrder(orderSchema.parse({ customer, items: [{ productId: 'a', quantity: 1 }] }), hiddenSection)).toThrow(OrderError)
  })
})

describe('orderSchema', () => {
  const base = { customer, items: [{ productId: 'a', quantity: 1 }] }

  it('acepta un pedido válido', () => {
    expect(orderSchema.safeParse(base).success).toBe(true)
  })

  it.each([
    ['nombre corto', { ...base, customer: { ...customer, name: 'A' } }],
    ['teléfono con letras', { ...base, customer: { ...customer, phone: 'llamame' } }],
    ['sin platos', { ...base, items: [] }],
    ['cantidad cero', { ...base, items: [{ productId: 'a', quantity: 0 }] }],
    ['cantidad mayor a 99', { ...base, items: [{ productId: 'a', quantity: 100 }] }],
    ['comentario de más de 500', { ...base, notes: 'x'.repeat(501) }],
  ])('rechaza %s', (_name, body) => {
    expect(orderSchema.safeParse(body).success).toBe(false)
  })
})

describe('isUuid', () => {
  it('distingue un token real de basura', () => {
    expect(isUuid('3f2b8c1e-9d4a-4e6b-8a1c-2f7d5e9b0c3a')).toBe(true)
    expect(isUuid('../../data/store')).toBe(false)
  })
})
