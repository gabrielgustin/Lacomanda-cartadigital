import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SETTINGS,
  acceptsOrdersAt,
  argentinaParts,
  checkoutSettings,
  couponValidOn,
  cuponSchema,
  findCoupon,
  isOpenAt,
  metodosPagoSchema,
  negocioSchema,
  sanitizeSettings,
  type Cupon,
  type OrderSettings,
} from '@/lib/settings'

// Argentina es UTC-3 todo el año. Viernes 2026-10-23.
const at = (iso: string) => new Date(iso)

const horarios = (changes: Record<number, { desde: string; hasta: string }[]>) =>
  Array.from({ length: 7 }, (_, day) => changes[day] ?? [])

const settings = (changes: Partial<OrderSettings> = {}): OrderSettings => ({ ...structuredClone(DEFAULT_SETTINGS), ...changes })

describe('argentinaParts', () => {
  it('convierte a hora argentina', () => {
    expect(argentinaParts(at('2026-10-23T23:30:00Z'))).toEqual({ weekday: 5, minutes: 20 * 60 + 30, ymd: '2026-10-23' })
  })

  it('a las 22:30 argentinas ya es el día siguiente en UTC, pero no en Argentina', () => {
    expect(argentinaParts(at('2026-10-24T01:30:00Z')).ymd).toBe('2026-10-23')
  })

  it('la medianoche argentina es 00:00, no 24:00', () => {
    expect(argentinaParts(at('2026-10-24T03:00:00Z'))).toMatchObject({ weekday: 6, minutes: 0, ymd: '2026-10-24' })
  })
})

describe('isOpenAt', () => {
  const week = settings({
    aceptarFueraDeHorario: false,
    horarios: horarios({
      5: [{ desde: '20:00', hasta: '02:00' }], // viernes, cruza la medianoche
      1: [
        { desde: '12:00', hasta: '15:00' },
        { desde: '20:00', hasta: '23:30' },
      ], // lunes, dos tramos
      2: [{ desde: '20:00', hasta: '00:00' }], // martes, cierra a medianoche
    }),
  })

  it('abierto dentro del tramo y cerrado antes', () => {
    expect(isOpenAt(week, at('2026-10-23T23:30:00Z'))).toBe(true) // vie 20:30
    expect(isOpenAt(week, at('2026-10-23T22:59:00Z'))).toBe(false) // vie 19:59
  })

  it('un tramo que cruza la medianoche sigue abierto la madrugada siguiente', () => {
    expect(isOpenAt(week, at('2026-10-24T04:00:00Z'))).toBe(true) // sáb 01:00
  })

  it('el límite "hasta" queda excluido', () => {
    expect(isOpenAt(week, at('2026-10-24T05:00:00Z'))).toBe(false) // sáb 02:00
  })

  it('soporta un segundo tramo en el mismo día', () => {
    expect(isOpenAt(week, at('2026-10-26T16:00:00Z'))).toBe(true) // lun 13:00
    expect(isOpenAt(week, at('2026-10-26T19:00:00Z'))).toBe(false) // lun 16:00 (entre tramos)
    expect(isOpenAt(week, at('2026-10-27T00:00:00Z'))).toBe(true) // lun 21:00
  })

  it('"hasta 00:00" cierra a la medianoche', () => {
    expect(isOpenAt(week, at('2026-10-28T02:59:00Z'))).toBe(true) // mar 23:59
    expect(isOpenAt(week, at('2026-10-28T03:00:00Z'))).toBe(false) // mié 00:00
  })

  it('un día sin tramos está cerrado', () => {
    expect(isOpenAt(week, at('2026-10-25T15:00:00Z'))).toBe(false) // dom 12:00
  })
})

describe('acceptsOrdersAt', () => {
  const closed = settings({ aceptarFueraDeHorario: false, horarios: horarios({}) })

  it('cerrado y sin "fuera de horario": no acepta', () => {
    expect(acceptsOrdersAt(closed, at('2026-10-23T23:30:00Z'))).toBe(false)
  })

  it('con "aceptar fuera de horario" siempre acepta', () => {
    expect(acceptsOrdersAt({ ...closed, aceptarFueraDeHorario: true }, at('2026-10-23T23:30:00Z'))).toBe(true)
  })

  it('abierto acepta aunque no se permita fuera de horario', () => {
    const open = settings({ aceptarFueraDeHorario: false, horarios: horarios({ 5: [{ desde: '20:00', hasta: '23:00' }] }) })
    expect(acceptsOrdersAt(open, at('2026-10-23T23:30:00Z'))).toBe(true)
  })
})

describe('cupones', () => {
  const base: Cupon = { id: 'c1', codigo: 'PRUEBA10', tipo: 'porcentaje', valor: 10, desde: null, hasta: null, activo: true }

  it('sin fechas vale siempre, y uno inactivo nunca', () => {
    expect(couponValidOn(base, at('2026-10-23T12:00:00Z'))).toBe(true)
    expect(couponValidOn({ ...base, activo: false }, at('2026-10-23T12:00:00Z'))).toBe(false)
  })

  it('las fechas son inclusivas y se miden en el día argentino', () => {
    const today = { ...base, desde: '2026-10-23', hasta: '2026-10-23' }
    expect(couponValidOn(today, at('2026-10-24T01:30:00Z'))).toBe(true) // 22:30 del 23 en Argentina
    expect(couponValidOn(today, at('2026-10-24T03:00:00Z'))).toBe(false) // ya es el 24
    expect(couponValidOn(today, at('2026-10-23T02:59:00Z'))).toBe(false) // todavía es el 22
  })

  it('un cupón vencido ayer no vale hoy', () => {
    expect(couponValidOn({ ...base, hasta: '2026-10-22' }, at('2026-10-23T15:00:00Z'))).toBe(false)
  })

  it('findCoupon ignora mayúsculas y espacios alrededor', () => {
    const list = settings({ cupones: [base] })
    expect(findCoupon(list, ' prueba10 ')?.id).toBe('c1')
    expect(findCoupon(list, 'OTRO')).toBeUndefined()
  })

  it('el esquema rechaza códigos con espacios o minúsculas, porcentajes fuera de rango y valores no positivos', () => {
    expect(cuponSchema.safeParse(base).success).toBe(true)
    expect(cuponSchema.safeParse({ ...base, codigo: 'PRUEBA 10' }).success).toBe(false)
    expect(cuponSchema.safeParse({ ...base, codigo: 'prueba10' }).success).toBe(false)
    expect(cuponSchema.safeParse({ ...base, valor: 101 }).success).toBe(false)
    expect(cuponSchema.safeParse({ ...base, valor: 0 }).success).toBe(false)
    expect(cuponSchema.safeParse({ ...base, tipo: 'fijo', valor: -5 }).success).toBe(false)
  })

  it('el esquema rechaza un rango de fechas invertido o inválido', () => {
    expect(cuponSchema.safeParse({ ...base, desde: '2026-10-25', hasta: '2026-10-23' }).success).toBe(false)
    expect(cuponSchema.safeParse({ ...base, desde: '2026-13-45' }).success).toBe(false)
  })
})

describe('medios de pago y datos del negocio', () => {
  const efectivo = { id: 'e', nombre: 'Efectivo', activo: true, predeterminado: true }
  const tarjeta = { id: 't', nombre: 'Tarjeta', activo: true, predeterminado: false }

  it('exige un único predeterminado y activo cuando hay métodos activos', () => {
    expect(metodosPagoSchema.safeParse([efectivo, tarjeta]).success).toBe(true)
    expect(metodosPagoSchema.safeParse([efectivo, { ...tarjeta, predeterminado: true }]).success).toBe(false)
    expect(metodosPagoSchema.safeParse([{ ...efectivo, predeterminado: false }, tarjeta]).success).toBe(false)
    expect(metodosPagoSchema.safeParse([{ ...efectivo, activo: false }, tarjeta]).success).toBe(false)
  })

  it('sin métodos activos no hay nada que exigir', () => {
    expect(metodosPagoSchema.safeParse([{ ...efectivo, activo: false, predeterminado: false }]).success).toBe(true)
    expect(metodosPagoSchema.safeParse([]).success).toBe(true)
  })

  it('las redes aceptan solo https o vacío', () => {
    const negocio = { whatsapp: '', direccion: '', instagram: '', facebook: '' }
    expect(negocioSchema.safeParse({ ...negocio, instagram: 'https://instagram.com/lacomanda' }).success).toBe(true)
    expect(negocioSchema.safeParse({ ...negocio, instagram: 'http://instagram.com/x' }).success).toBe(false)
    expect(negocioSchema.safeParse({ ...negocio, facebook: 'javascript:alert(1)' }).success).toBe(false)
  })
})

describe('sanitizeSettings', () => {
  it('sin datos devuelve los valores por defecto', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('basura')).toEqual(DEFAULT_SETTINGS)
  })

  it('una sección corrupta vuelve a su valor por defecto sin tocar las demás', () => {
    const raw = {
      horarios: 'roto',
      aceptarFueraDeHorario: false,
      metodosPago: [{ id: 'x', nombre: 'Transferencia', activo: true, predeterminado: true }],
    }
    const result = sanitizeSettings(raw)
    expect(result.horarios).toEqual(DEFAULT_SETTINGS.horarios)
    expect(result.aceptarFueraDeHorario).toBe(true) // viene junto con los horarios rotos
    expect(result.metodosPago[0].nombre).toBe('Transferencia')
  })

  it('no comparte referencias con DEFAULT_SETTINGS', () => {
    const result = sanitizeSettings(undefined)
    result.cupones.push({ id: 'x', codigo: 'X', tipo: 'fijo', valor: 1, desde: null, hasta: null, activo: true })
    expect(DEFAULT_SETTINGS.cupones).toHaveLength(0)
  })
})

describe('checkoutSettings', () => {
  it('muestra solo los medios activos y nunca incluye cupones', () => {
    const result = checkoutSettings(
      settings({
        metodosPago: [
          { id: 'e', nombre: 'Efectivo', activo: true, predeterminado: true },
          { id: 't', nombre: 'Tarjeta', activo: false, predeterminado: false },
        ],
        cupones: [{ id: 'c', codigo: 'SECRETO', tipo: 'fijo', valor: 10, desde: null, hasta: null, activo: true }],
      }),
    )
    expect(result.metodosPago).toEqual([{ id: 'e', nombre: 'Efectivo', predeterminado: true }])
    expect(JSON.stringify(result)).not.toContain('SECRETO')
    expect(result).not.toHaveProperty('cupones')
  })
})
