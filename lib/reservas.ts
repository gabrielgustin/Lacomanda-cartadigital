import { z } from 'zod'
import { query } from '@/lib/db'

export const ESTADOS = ['pendiente', 'confirmada', 'cancelada'] as const
export type Estado = (typeof ESTADOS)[number]

export type Reserva = { id: number; nombre: string; fecha: string; hora: string; personas: number; estado: Estado; creada: string }

// Lo que manda la web. Fecha "AAAA-MM-DD" y hora "HH:MM"; el servidor revisa que no sea del pasado ni muy lejana.
export const reservaSchema = z.object({
  nombre: z.string().trim().min(2).max(60),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  personas: z.number().int().min(1).max(40),
})

/** Hoy en Argentina como "AAAA-MM-DD" (el servidor corre en UTC). */
export const hoyAR = (now = new Date()) => new Date(now.getTime() - 3 * 3600_000).toISOString().slice(0, 10)

/** null si la fecha es válida; si no, el motivo. Hasta 120 días hacia adelante. */
export function fechaInvalida(fecha: string, now = new Date()): string | null {
  const hoy = hoyAR(now)
  const limite = hoyAR(new Date(now.getTime() + 120 * 86_400_000))
  if (Number.isNaN(Date.parse(fecha))) return 'La fecha no es válida.'
  if (fecha < hoy) return 'La fecha ya pasó.'
  if (fecha > limite) return 'La fecha es demasiado lejana.'
  return null
}

const COLUMNS = `id, nombre, to_char(fecha, 'YYYY-MM-DD') AS fecha, hora, personas, estado, creada::text`

export const crearReserva = (r: z.infer<typeof reservaSchema>) =>
  query<{ id: number }>('INSERT INTO reservas (nombre, fecha, hora, personas) VALUES ($1, $2, $3, $4) RETURNING id', [r.nombre, r.fecha, r.hora, r.personas])

export const listarReservas = () => query<Reserva>(`SELECT ${COLUMNS} FROM reservas ORDER BY fecha DESC, hora DESC LIMIT 500`)

export const cambiarEstado = (id: number, estado: Estado) => query('UPDATE reservas SET estado = $2 WHERE id = $1', [id, estado])

export const borrarReserva = (id: number) => query('DELETE FROM reservas WHERE id = $1', [id])
