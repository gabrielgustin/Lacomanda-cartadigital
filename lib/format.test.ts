import { describe, expect, it } from 'vitest'
import { formatOrderDate, formatPrice, normalizeText } from '@/lib/format'

describe('formatOrderDate', () => {
  it('convierte a hora de Buenos Aires (UTC-3)', () => {
    expect(formatOrderDate('2026-10-23T03:05:00Z')).toBe('23/10/2026 00:05')
    expect(formatOrderDate('2026-10-23T15:30:00Z')).toBe('23/10/2026 12:30')
  })
})

describe('formatPrice', () => {
  it('usa punto como separador de miles', () => {
    expect(formatPrice(12345)).toBe('$12.345')
  })
})

describe('normalizeText', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizeText('Café')).toBe('cafe')
  })
})
