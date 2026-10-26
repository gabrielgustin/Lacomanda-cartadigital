'use server'

import { randomBytes } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/app/backoffice/actions'
import { requireAdmin } from '@/lib/backoffice-auth'
import {
  cuponSchema,
  horariosSchema,
  metodosPagoSchema,
  negocioSchema,
  type OrderSettings,
} from '@/lib/settings'
import { toWhatsAppNumber } from '@/lib/whatsapp'
import { updateStore } from '@/lib/store'
import type { z } from 'zod'

// En un archivo 'use server' todo export async es invocable desde el navegador: por eso estos helpers NO se exportan.
const fail = (error: string): ActionResult => ({ ok: false, error })

// Los mensajes propios (refine) están en español; los genéricos de zod no le sirven al dueño.
const firstMessage = (error: z.ZodError) => error.issues.find((issue) => issue.code === 'custom')?.message ?? 'Revisá los datos: hay campos inválidos.'

async function saveSettings(change: (settings: OrderSettings) => string | void): Promise<ActionResult> {
  await requireAdmin()
  try {
    const error = await updateStore((draft) => change(draft.settings))
    if (error) return fail(error)
  } catch (error) {
    console.error('[backoffice] No se pudo guardar la configuración', error)
    // El conflicto de edición simultánea trae un mensaje claro para el dueño; el resto es un error de conexión.
    if (error instanceof Error && error.message.startsWith('No se pudo guardar:')) return fail(error.message)
    return fail('No se pudieron guardar los cambios. Revisá la conexión con la base de datos e intentá de nuevo.')
  }
  revalidatePath('/backoffice', 'layout')
  return { ok: true }
}

export async function saveHours(input: unknown): Promise<ActionResult> {
  const parsed = horariosSchema.safeParse(input)
  if (!parsed.success) return fail(firstMessage(parsed.error))
  return saveSettings((settings) => {
    settings.horarios = parsed.data.horarios
    settings.aceptarFueraDeHorario = parsed.data.aceptarFueraDeHorario
  })
}

export async function savePaymentMethods(input: unknown): Promise<ActionResult> {
  const parsed = metodosPagoSchema.safeParse(input)
  if (!parsed.success) return fail(firstMessage(parsed.error))
  if (new Set(parsed.data.map((method) => method.id)).size !== parsed.data.length) return fail('Hay medios de pago repetidos.')
  return saveSettings((settings) => {
    settings.metodosPago = parsed.data
  })
}

export async function saveCoupon(input: unknown): Promise<ActionResult> {
  // El código se normaliza acá (mayúsculas); los espacios no se corrigen en silencio: el esquema los rechaza.
  const raw = input && typeof input === 'object' ? (input as Record<string, unknown>) : {}
  const candidate = {
    ...raw,
    id: typeof raw.id === 'string' && raw.id ? raw.id : randomBytes(8).toString('hex'),
    codigo: typeof raw.codigo === 'string' ? raw.codigo.trim().toUpperCase() : raw.codigo,
  }
  const parsed = cuponSchema.safeParse(candidate)
  if (!parsed.success) return fail(firstMessage(parsed.error))

  return saveSettings((settings) => {
    if (settings.cupones.some((cupon) => cupon.codigo === parsed.data.codigo && cupon.id !== parsed.data.id)) {
      return 'Ya existe un cupón con ese código.'
    }
    const index = settings.cupones.findIndex((cupon) => cupon.id === parsed.data.id)
    if (index >= 0) settings.cupones[index] = parsed.data
    else if (settings.cupones.length >= 200) return 'Llegaste al máximo de cupones.'
    else settings.cupones.push(parsed.data)
  })
}

export async function deleteCoupon(id: unknown): Promise<ActionResult> {
  if (typeof id !== 'string') return fail('Cupón inválido.')
  return saveSettings((settings) => {
    settings.cupones = settings.cupones.filter((cupon) => cupon.id !== id)
  })
}

export async function saveBusiness(input: unknown): Promise<ActionResult> {
  const parsed = negocioSchema.safeParse(input)
  if (!parsed.success) return fail('Revisá los datos: las redes tienen que ser direcciones https.')
  if (parsed.data.whatsapp && !toWhatsAppNumber(parsed.data.whatsapp)) {
    return fail('El WhatsApp no parece un número argentino válido (ej. 351 555-1234).')
  }
  return saveSettings((settings) => {
    settings.negocio = parsed.data
  })
}
