import { describe, expect, it } from 'vitest'
import { toWhatsAppNumber, waLink } from '@/lib/whatsapp'

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
