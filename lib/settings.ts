import { z } from 'zod'

// Configuración que alimenta el pedido para llevar. Puro (sin `fs`): lo usan el servidor, el cliente y los tests.

const TIMEZONE = 'America/Argentina/Buenos_Aires'

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)
const isoDay = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)))

/** `hasta` menor o igual a `desde` significa que el tramo cruza la medianoche (ej. 20:00 a 02:00). */
export const tramoSchema = z.object({ desde: hhmm, hasta: hhmm })

export const horariosSchema = z.object({
  /** 7 entradas; el índice es getDay() (0 = domingo). Vacío = cerrado ese día. Hasta 2 tramos por día. */
  horarios: z.array(z.array(tramoSchema).max(2)).length(7),
  aceptarFueraDeHorario: z.boolean(),
})

export const metodoPagoSchema = z.object({
  id: z.string().min(1).max(40),
  nombre: z.string().trim().min(1).max(40),
  activo: z.boolean(),
  predeterminado: z.boolean(),
})

// Con métodos activos tiene que haber exactamente un predeterminado y estar activo.
export const metodosPagoSchema = z.array(metodoPagoSchema).max(20).refine(
  (list) => {
    const active = list.filter((method) => method.activo)
    if (active.length === 0) return true
    const defaults = list.filter((method) => method.predeterminado)
    return defaults.length === 1 && defaults[0].activo
  },
  { message: 'Tiene que haber exactamente un medio de pago predeterminado y debe estar activo.' },
)

// El código se guarda ya normalizado: mayúsculas, sin espacios. Quien lo carga lo pasa por toUpperCase() antes de validar.
export const cuponSchema = z
  .object({
    id: z.string().min(1).max(40),
    codigo: z.string().regex(/^[A-Z0-9_-]{1,30}$/),
    tipo: z.enum(['porcentaje', 'fijo']),
    valor: z.number(),
    /** 'YYYY-MM-DD' en hora argentina, inclusive. */
    desde: isoDay.nullable(),
    hasta: isoDay.nullable(),
    activo: z.boolean(),
  })
  .refine((cupon) => (cupon.tipo === 'porcentaje' ? cupon.valor > 0 && cupon.valor <= 100 : cupon.valor > 0), {
    message: 'El porcentaje va de 1 a 100 y el monto fijo debe ser mayor a 0.',
    path: ['valor'],
  })
  .refine((cupon) => !cupon.desde || !cupon.hasta || cupon.desde <= cupon.hasta, {
    message: 'La fecha de inicio no puede ser posterior al fin.',
    path: ['hasta'],
  })

const httpsUrlOrEmpty = z
  .string()
  .trim()
  .max(200)
  .refine((value) => {
    if (value === '') return true
    try {
      return new URL(value).protocol === 'https:'
    } catch {
      return false
    }
  })

export const negocioSchema = z.object({
  whatsapp: z.string().trim().max(30),
  direccion: z.string().trim().max(200),
  instagram: httpsUrlOrEmpty,
  facebook: httpsUrlOrEmpty,
})

export type Tramo = z.infer<typeof tramoSchema>
export type MetodoPago = z.infer<typeof metodoPagoSchema>
export type Cupon = z.infer<typeof cuponSchema>
export type Negocio = z.infer<typeof negocioSchema>

export interface OrderSettings {
  horarios: Tramo[][]
  aceptarFueraDeHorario: boolean
  metodosPago: MetodoPago[]
  cupones: Cupon[]
  negocio: Negocio
}

export const DEFAULT_SETTINGS: OrderSettings = {
  horarios: Array.from({ length: 7 }, () => []),
  // Abierto por defecto: hasta que el dueño cargue horarios, nadie queda bloqueado.
  aceptarFueraDeHorario: true,
  metodosPago: [{ id: 'efectivo', nombre: 'Efectivo', activo: true, predeterminado: true }],
  cupones: [],
  negocio: { whatsapp: '', direccion: '', instagram: '', facebook: '' },
}

/** Lee la configuración guardada; cada sección inválida o ausente vuelve a su valor por defecto sin tocar las demás. */
export function sanitizeSettings(raw: unknown): OrderSettings {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const defaults = structuredClone(DEFAULT_SETTINGS)
  const hours = horariosSchema.safeParse({ horarios: source.horarios, aceptarFueraDeHorario: source.aceptarFueraDeHorario })
  const payments = metodosPagoSchema.safeParse(source.metodosPago)
  const coupons = z.array(cuponSchema).max(200).safeParse(source.cupones)
  const business = negocioSchema.safeParse(source.negocio)
  return {
    horarios: hours.success ? hours.data.horarios : defaults.horarios,
    aceptarFueraDeHorario: hours.success ? hours.data.aceptarFueraDeHorario : defaults.aceptarFueraDeHorario,
    metodosPago: payments.success ? payments.data : defaults.metodosPago,
    cupones: coupons.success ? coupons.data : defaults.cupones,
    negocio: business.success ? business.data : defaults.negocio,
  }
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }

/** Día de la semana (0 = domingo), minutos desde medianoche y fecha 'YYYY-MM-DD' en hora argentina. */
export function argentinaParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONE,
      hourCycle: 'h23',
      weekday: 'short',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  )
  return {
    weekday: WEEKDAYS[parts.weekday],
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    ymd: `${parts.year}-${parts.month}-${parts.day}`,
  }
}

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const crossesMidnight = (tramo: Tramo) => toMinutes(tramo.hasta) <= toMinutes(tramo.desde)

export function isOpenAt(settings: Pick<OrderSettings, 'horarios'>, date: Date) {
  const { weekday, minutes } = argentinaParts(date)
  const today = settings.horarios[weekday] ?? []
  const yesterday = settings.horarios[(weekday + 6) % 7] ?? []

  const openToday = today.some((tramo) =>
    crossesMidnight(tramo) ? minutes >= toMinutes(tramo.desde) : minutes >= toMinutes(tramo.desde) && minutes < toMinutes(tramo.hasta),
  )
  // Un tramo de ayer que cruza la medianoche sigue abierto hasta su cierre de hoy.
  const openFromYesterday = yesterday.some((tramo) => crossesMidnight(tramo) && minutes < toMinutes(tramo.hasta))
  return openToday || openFromYesterday
}

/** Única regla de "¿se toman pedidos ahora?": la usan la pantalla de checkout y la API de pedidos. */
export const acceptsOrdersAt = (settings: Pick<OrderSettings, 'horarios' | 'aceptarFueraDeHorario'>, date: Date) =>
  settings.aceptarFueraDeHorario || isOpenAt(settings, date)

export function couponValidOn(cupon: Cupon, date: Date) {
  if (!cupon.activo) return false
  const { ymd } = argentinaParts(date)
  return (!cupon.desde || ymd >= cupon.desde) && (!cupon.hasta || ymd <= cupon.hasta)
}

export const findCoupon = (settings: Pick<OrderSettings, 'cupones'>, code: string) => {
  const wanted = code.trim().toUpperCase()
  return settings.cupones.find((cupon) => cupon.codigo === wanted)
}

/** Lo único de la configuración que viaja al navegador del cliente. Nunca incluye cupones. */
export const checkoutSettings = (settings: OrderSettings) => ({
  metodosPago: settings.metodosPago.filter((method) => method.activo).map(({ id, nombre, predeterminado }) => ({ id, nombre, predeterminado })),
  negocio: settings.negocio,
})
