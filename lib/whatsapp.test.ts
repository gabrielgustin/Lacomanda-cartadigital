import { describe, expect, it } from 'vitest'
import { orderMessage, toWhatsAppNumber, waLink } from '@/lib/whatsapp'

describe('toWhatsAppNumber', () => {
  it('quita el 0 de área y el 15 móvil', () => {
    expect(toWhatsAppNumber('0351 15-555-1234')).toBe('5493515551234')
    expect(toWhatsAppNumber('011 15 4444-5555')).toBe('5491144445555')
  })

  it('acepta prefijo +54 9', () => {
    expect(toWhatsAppNumber('+54 9 351 555 1234')).toBe('5493515551234')
  })

  it('acepta número local de 10 dígitos', () => {
    expect(toWhatsAppNumber('3515551234')).toBe('5493515551234')
  })

  it('devuelve null si no tiene 10 dígitos', () => {
    expect(toWhatsAppNumber('12345')).toBeNull()
    expect(toWhatsAppNumber('abc')).toBeNull()
  })
})

describe('waLink', () => {
  it('arma el link con el texto codificado', () => {
    expect(waLink('3515551234', 'Hola & chau')).toBe(
      'https://wa.me/5493515551234?text=Hola%20%26%20chau',
    )
  })

  it('devuelve null si el teléfono no es válido', () => {
    expect(waLink('abc', 'x')).toBeNull()
  })
})

describe('orderMessage', () => {
  const order = {
    clienteNombre: 'Ana',
    clienteTelefono: '351 555-1234',
    formaEntrega: 'Delivery',
    direccion: 'Calle 123',
    notas: 'sin cebolla',
    metodoPago: 'Efectivo',
    cupon: null,
    subtotal: 20000,
    descuento: 0,
    total: 20000,
    items: [{ nombre: { es: 'Mozzarella' }, precioUnitario: 10000, cantidad: 2 }],
  }

  it('incluye platos, total, entrega, dirección y datos del cliente', () => {
    const text = orderMessage(order)
    expect(text).toContain('2 x Mozzarella')
    expect(text).toContain('Total: $20.000')
    expect(text).toContain('Dirección: Calle 123')
    expect(text).toContain('Comentarios: sin cebolla')
  })

  it('muestra el descuento solo si hay cupón aplicado', () => {
    expect(orderMessage(order)).not.toContain('Descuento')
    expect(orderMessage({ ...order, descuento: 2000, cupon: 'PROMO', total: 18000 })).toContain('Descuento (PROMO): -$2.000')
  })
})
