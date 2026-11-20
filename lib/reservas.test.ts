import { describe, expect, it } from 'vitest'
import { fechaInvalida, hoyAR, reservaSchema } from '@/lib/reservas'

const ahora = new Date('2026-11-20T15:00:00Z') // 12:00 en Argentina

describe('reservas', () => {
  it('hoyAR usa la hora de Argentina', () => {
    expect(hoyAR(new Date('2026-11-21T01:00:00Z'))).toBe('2026-11-20')
  })
  it('rechaza fechas pasadas y muy lejanas, acepta hoy y próximas', () => {
    expect(fechaInvalida('2026-11-19', ahora)).toMatch(/pasó/)
    expect(fechaInvalida('2027-06-01', ahora)).toMatch(/lejana/)
    expect(fechaInvalida('2026-11-20', ahora)).toBeNull()
    expect(fechaInvalida('2026-12-24', ahora)).toBeNull()
  })
  it('valida el formato de lo que manda la web', () => {
    const ok = { nombre: 'Ana', fecha: '2026-12-01', hora: '21:30', personas: 4 }
    expect(reservaSchema.safeParse(ok).success).toBe(true)
    expect(reservaSchema.safeParse({ ...ok, hora: '25:00' }).success).toBe(false)
    expect(reservaSchema.safeParse({ ...ok, personas: 0 }).success).toBe(false)
    expect(reservaSchema.safeParse({ ...ok, nombre: '' }).success).toBe(false)
  })
})
