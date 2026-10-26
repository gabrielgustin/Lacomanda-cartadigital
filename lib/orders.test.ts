import { describe, expect, it } from 'vitest'
import type { MenuItem, MenuSection } from '@/lib/menu-data'
import { OrderError, buildOrder } from '@/lib/orders'
import { orderSchema } from '@/lib/order-schema'
import { DEFAULT_SETTINGS, type OrderSettings } from '@/lib/settings'

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

// Viernes 2026-10-23, 20:30 en Argentina (UTC-3).
const NOW = new Date('2026-10-23T23:30:00Z')

const settings = (changes: Partial<OrderSettings> = {}): OrderSettings => ({
  ...structuredClone(DEFAULT_SETTINGS),
  cupones: [
    { id: 'c1', codigo: 'PRUEBA10', tipo: 'porcentaje', valor: 10, desde: null, hasta: null, activo: true },
    { id: 'c2', codigo: 'VENCIDO', tipo: 'fijo', valor: 500, desde: '2026-01-01', hasta: '2026-10-22', activo: true },
    { id: 'c3', codigo: 'APAGADO', tipo: 'fijo', valor: 500, desde: null, hasta: null, activo: false },
    { id: 'c4', codigo: 'GRANDE', tipo: 'fijo', valor: 99999, desde: null, hasta: null, activo: true },
  ],
  ...changes,
})

const build = (body: unknown, config = settings()) =>
  buildOrder(orderSchema.parse({ paymentMethodId: 'efectivo', ...(body as object) }), sections, config, NOW)

describe('buildOrder', () => {
  it('recalcula precios desde la carta e ignora los que mande el navegador', () => {
    // El esquema descarta cualquier campo que no sea id y cantidad, así que "price" nunca llega.
    const order = build({ customer, items: [{ productId: 'a', quantity: 2, price: 1, total: 1 }], total: 1, descuento: 999 })
    expect(order.items[0].precioUnitario).toBe(1000)
    expect(order.subtotal).toBe(2000)
    expect(order.descuento).toBe(0)
    expect(order.total).toBe(2000)
  })

  it('suma un mismo plato repetido y respeta el tope de 99', () => {
    const order = build({ customer, items: [{ productId: 'a', quantity: 60 }, { productId: 'a', quantity: 60 }] })
    expect(order.items).toEqual([expect.objectContaining({ productId: 'a', cantidad: 99 })])
  })

  it('rechaza un plato oculto', () => {
    expect(() => build({ customer, items: [{ productId: 'oculto', quantity: 1 }] })).toThrow(OrderError)
  })

  it('rechaza un plato inexistente y uno de una categoría oculta', () => {
    expect(() => build({ customer, items: [{ productId: 'nada', quantity: 1 }] })).toThrow(OrderError)
    const hiddenSection = [section([item('a', 1000)], false)]
    const input = orderSchema.parse({ customer, paymentMethodId: 'efectivo', items: [{ productId: 'a', quantity: 1 }] })
    expect(() => buildOrder(input, hiddenSection, settings(), NOW)).toThrow(OrderError)
  })

  describe('local cerrado', () => {
    const closed = settings({ aceptarFueraDeHorario: false, horarios: Array.from({ length: 7 }, () => []) })

    it('sin "aceptar fuera de horario" responde 409', () => {
      expect(() => build({ customer, items: [{ productId: 'a', quantity: 1 }] }, closed)).toThrowError(expect.objectContaining({ status: 409 }))
    })

    it('con "aceptar fuera de horario" sigue aceptando', () => {
      expect(build({ customer, items: [{ productId: 'a', quantity: 1 }] }, { ...closed, aceptarFueraDeHorario: true }).total).toBe(1000)
    })

    it('abierto en su horario acepta aunque no se permita fuera de horario', () => {
      const horarios = Array.from({ length: 7 }, (_, day) => (day === 5 ? [{ desde: '20:00', hasta: '23:00' }] : []))
      expect(build({ customer, items: [{ productId: 'a', quantity: 1 }] }, { ...closed, horarios }).total).toBe(1000)
    })
  })

  describe('cupones', () => {
    const items = [{ productId: 'a', quantity: 2 }, { productId: 'b', quantity: 1 }] // subtotal 4500

    it('aplica el descuento y calcula el total en el servidor', () => {
      const order = build({ customer, items, coupon: 'prueba10' }) // el esquema lo pasa a mayúsculas
      expect(order).toMatchObject({ subtotal: 4500, descuento: 450, total: 4050, cupon: 'PRUEBA10' })
    })

    it.each(['VENCIDO', 'APAGADO', 'NOEXISTE'])('rechaza el cupón %s con 400', (coupon) => {
      expect(() => build({ customer, items, coupon })).toThrowError(expect.objectContaining({ status: 400 }))
    })

    it('un cupón mayor al subtotal deja el total en cero, nunca negativo', () => {
      expect(build({ customer, items, coupon: 'GRANDE' })).toMatchObject({ descuento: 4500, total: 0 })
    })

    it('sin cupón no hay descuento ni código', () => {
      expect(build({ customer, items })).toMatchObject({ descuento: 0, cupon: null })
    })
  })

  describe('medio de pago', () => {
    const items = [{ productId: 'a', quantity: 1 }]
    const withMethods = settings({
      metodosPago: [
        { id: 'efectivo', nombre: 'Efectivo', activo: true, predeterminado: true },
        { id: 'tarjeta', nombre: 'Tarjeta', activo: false, predeterminado: false },
      ],
    })

    it('guarda el NOMBRE del medio elegido', () => {
      expect(build({ customer, items, paymentMethodId: 'efectivo' }, withMethods).metodoPago).toBe('Efectivo')
    })

    it('rechaza un medio inactivo, inexistente o ausente', () => {
      expect(() => build({ customer, items, paymentMethodId: 'tarjeta' }, withMethods)).toThrowError(expect.objectContaining({ status: 400 }))
      expect(() => build({ customer, items, paymentMethodId: 'nada' }, withMethods)).toThrow(OrderError)
      expect(() => buildOrder(orderSchema.parse({ customer, items }), sections, withMethods, NOW)).toThrow(OrderError)
    })

    it('sin ningún medio activo no se pide ni se guarda', () => {
      const none = settings({ metodosPago: [] })
      expect(buildOrder(orderSchema.parse({ customer, items }), sections, none, NOW).metodoPago).toBeNull()
    })
  })
})

describe('orderSchema', () => {
  const base = { customer, items: [{ productId: 'a', quantity: 1 }] }

  it('acepta un pedido válido y por defecto es retiro', () => {
    const parsed = orderSchema.parse(base)
    expect(parsed.delivery).toBe('retiro')
  })

  it('acepta delivery con dirección', () => {
    expect(orderSchema.safeParse({ ...base, delivery: 'delivery', address: 'Av. Mate de Luna 1234' }).success).toBe(true)
  })

  it.each([
    ['nombre corto', { ...base, customer: { ...customer, name: 'A' } }],
    ['teléfono con letras', { ...base, customer: { ...customer, phone: 'llamame' } }],
    ['sin platos', { ...base, items: [] }],
    ['cantidad cero', { ...base, items: [{ productId: 'a', quantity: 0 }] }],
    ['cantidad mayor a 99', { ...base, items: [{ productId: 'a', quantity: 100 }] }],
    ['comentario de más de 500', { ...base, notes: 'x'.repeat(501) }],
    ['delivery sin dirección', { ...base, delivery: 'delivery' }],
    ['forma de entrega inventada', { ...base, delivery: 'moto' }],
  ])('rechaza %s', (_name, body) => {
    expect(orderSchema.safeParse(body).success).toBe(false)
  })
})

describe('delivery en buildOrder', () => {
  const items = [{ productId: 'a', quantity: 1 }]
  it('guarda la dirección solo con delivery', () => {
    const delivery = build({ customer, items, delivery: 'delivery', address: 'Calle 123' })
    expect(delivery.formaEntrega).toBe('Delivery')
    expect(delivery.direccion).toBe('Calle 123')
    const pickup = build({ customer, items, address: 'Calle 123' })
    expect(pickup.formaEntrega).toBe('Retiro en el local')
    expect(pickup.direccion).toBeNull()
  })
})
