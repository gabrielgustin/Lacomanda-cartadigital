'use server'

import { revalidatePath, updateTag } from 'next/cache'
import type { ActionResult } from '@/app/backoffice/actions'
import { requireAdmin } from '@/lib/backoffice-auth'
import { borrarReserva, cambiarEstado, ESTADOS, type Estado } from '@/lib/reservas'
import { borrarResena, crearResena, editarResena, RESENAS_TAG, resenaSchema } from '@/lib/resenas'

// En un archivo 'use server' todo export async es invocable desde el navegador: estos helpers NO se exportan.
const fail = (error: string): ActionResult => ({ ok: false, error })
const FALLO = 'No se pudo completar la acción. Revisá la conexión e intentá de nuevo.'

async function run(path: string, job: () => Promise<unknown>): Promise<ActionResult> {
  await requireAdmin()
  try {
    await job()
  } catch (error) {
    console.error('[backoffice] reservas/reseñas', error)
    return fail(FALLO)
  }
  if (path.includes('resenas')) updateTag(RESENAS_TAG)
  revalidatePath(path)
  return { ok: true }
}

const idValido = (id: unknown): id is number => typeof id === 'number' && Number.isInteger(id) && id > 0

export async function setReservaEstado(id: number, estado: Estado): Promise<ActionResult> {
  if (!idValido(id) || !ESTADOS.includes(estado)) return fail('Datos inválidos.')
  return run('/backoffice/reservas', () => cambiarEstado(id, estado))
}

export async function deleteReserva(id: number): Promise<ActionResult> {
  if (!idValido(id)) return fail('Datos inválidos.')
  return run('/backoffice/reservas', () => borrarReserva(id))
}

export async function saveResena(id: number | null, input: unknown): Promise<ActionResult> {
  const parsed = resenaSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Revisá los datos.')
  if (id !== null && !idValido(id)) return fail('Datos inválidos.')
  return run('/backoffice/resenas', () => (id === null ? crearResena(parsed.data) : editarResena(id, parsed.data)))
}

export async function deleteResena(id: number): Promise<ActionResult> {
  if (!idValido(id)) return fail('Datos inválidos.')
  return run('/backoffice/resenas', () => borrarResena(id))
}
