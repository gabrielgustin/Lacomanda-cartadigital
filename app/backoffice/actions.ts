'use server'

import { randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import {
  SESSION_COOKIE,
  checkCredentials,
  createSessionToken,
  isConfigured,
  requireAdmin,
  sessionCookieOptions,
} from '@/lib/backoffice-auth'
import { categoryIcons } from '@/lib/category-icons'
import type { Localized, MenuItem, MenuSection } from '@/lib/menu-data'
import { updateStore, type StoreData } from '@/lib/store'
import { sanitizeTheme, type ThemeSettings } from '@/lib/theme'

export type ActionResult = { ok: true } | { ok: false; error: string }

const fail = (error: string): ActionResult => ({ ok: false, error })

// ───────────── Sesión ─────────────

let failedLogins: number[] = []

export async function login(_previous: string | null, formData: FormData): Promise<string | null> {
  if (!isConfigured()) return 'Falta definir BACKOFFICE_PASSWORD en el archivo .env.local.'

  // Freno básico contra fuerza bruta: 5 intentos fallidos por minuto en total.
  const now = Date.now()
  failedLogins = failedLogins.filter((time) => now - time < 60_000)
  if (failedLogins.length >= 5) return 'Demasiados intentos. Esperá un minuto y probá de nuevo.'

  if (!checkCredentials(String(formData.get('username') ?? ''), String(formData.get('password') ?? ''))) {
    failedLogins.push(now)
    await new Promise((resolve) => setTimeout(resolve, 600))
    return 'Usuario o contraseña incorrectos.'
  }

  failedLogins = []
  ;(await cookies()).set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions)
  redirect('/backoffice')
}

export async function logout() {
  ;(await cookies()).delete(SESSION_COOKIE)
  redirect('/backoffice/login')
}

// ───────────── Validación ─────────────

const text = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

// El inglés es opcional: si queda vacío se copia el español para que la carta nunca muestre huecos.
const localized = (value: Partial<Localized> | undefined, max: number): Localized => {
  const es = text(value?.es, max)
  return { es, en: text(value?.en, max) || es }
}

const IMAGE_PATH = /^\/(menu|media)\/[\w.-]+$/
const validImage = (value: unknown): value is string => typeof value === 'string' && IMAGE_PATH.test(value)

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'categoria'

const uniqueId = (base: string, taken: Set<string>) => {
  let id = base
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`
  return id
}

async function mutate(change: (draft: StoreData) => string | void): Promise<ActionResult> {
  await requireAdmin()
  try {
    const error = await updateStore((draft) => change(draft))
    if (error) return fail(error)
  } catch (error) {
    console.error('[backoffice] No se pudo guardar', error)
    // El conflicto de edición simultánea trae un mensaje claro para el dueño; el resto es un error de conexión.
    if (error instanceof Error && error.message.startsWith('No se pudo guardar:')) return fail(error.message)
    return fail('No se pudieron guardar los cambios. Revisá la conexión con la base de datos e intentá de nuevo.')
  }
  revalidatePath('/')
  revalidatePath('/backoffice', 'layout')
  return { ok: true }
}

// ───────────── Categorías ─────────────

export interface CategoryInput {
  id?: string
  label: Localized
  title: Localized
  eyebrow: Localized
  icon: string
  image: string
  visible: boolean
}

export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  const label = localized(input.label, 40)
  const title = localized(input.title, 80)
  const eyebrow = localized(input.eyebrow, 80)
  if (!label.es) return fail('Escribí el nombre de la categoría.')
  if (!title.es) {
    title.es = label.es
    title.en = label.en
  }
  if (!validImage(input.image)) return fail('Elegí una imagen para la categoría.')
  const icon = input.icon in categoryIcons ? input.icon : 'utensils'

  return mutate((draft) => {
    const fields = { label, title, eyebrow, icon, image: input.image, visible: Boolean(input.visible) }
    const existing = input.id ? draft.sections.find((section) => section.id === input.id) : undefined
    if (existing) {
      Object.assign(existing, fields)
      return
    }
    if (input.id) return 'La categoría ya no existe.'
    // El id queda fijo para siempre (es el ancla de la carta): renombrar no lo cambia.
    const id = uniqueId(slugify(label.es), new Set(draft.sections.map((section) => section.id)))
    draft.sections.push({ id, ...fields, items: [] } satisfies MenuSection)
  })
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return mutate((draft) => {
    const index = draft.sections.findIndex((section) => section.id === id)
    if (index === -1) return 'La categoría ya no existe.'
    draft.sections.splice(index, 1)
  })
}

const move = <T,>(list: T[], index: number, direction: -1 | 1) => {
  const target = index + direction
  if (index < 0 || target < 0 || target >= list.length) return
  ;[list[index], list[target]] = [list[target], list[index]]
}

export async function moveCategory(id: string, direction: -1 | 1): Promise<ActionResult> {
  return mutate((draft) => move(draft.sections, draft.sections.findIndex((section) => section.id === id), direction))
}

export async function setCategoryVisible(id: string, visible: boolean): Promise<ActionResult> {
  return mutate((draft) => {
    const section = draft.sections.find((entry) => entry.id === id)
    if (!section) return 'La categoría ya no existe.'
    section.visible = visible
  })
}

// ───────────── Productos ─────────────

export interface ProductInput {
  id?: string
  sectionId: string
  name: Localized
  description: Localized
  price: number
  image: string | null
  /** Subcategoría opcional. */
  group?: Localized | null
  visible: boolean
}

export async function saveProduct(input: ProductInput): Promise<ActionResult> {
  const name = localized(input.name, 80)
  const description = localized(input.description, 400)
  const price = Math.round(Number(input.price) * 100) / 100
  // Sin nombre en español no hay subcategoría; sin inglés se copia el español (igual que los nombres).
  const group = text(input.group?.es, 40) ? localized(input.group ?? undefined, 40) : undefined
  if (!name.es) return fail('Escribí el nombre del producto.')
  if (!Number.isFinite(price) || price < 0 || price > 99_999_999) return fail('El precio no es válido.')
  if (input.image !== null && !validImage(input.image)) return fail('La imagen no es válida.')

  return mutate((draft) => {
    const target = draft.sections.find((section) => section.id === input.sectionId)
    if (!target) return 'La categoría elegida ya no existe.'

    const fields = { name, description, price, image: input.image ?? undefined, group, visible: Boolean(input.visible) }

    if (!input.id) {
      const item: MenuItem = { id: `p-${randomBytes(5).toString('hex')}`, sectionId: target.id, ...fields }
      target.items.push(item)
      return
    }

    for (const section of draft.sections) {
      const index = section.items.findIndex((entry) => entry.id === input.id)
      if (index === -1) continue
      const item = { ...section.items[index], ...fields, sectionId: target.id }
      if (section === target) section.items[index] = item
      else {
        section.items.splice(index, 1)
        target.items.push(item)
      }
      return
    }
    return 'El producto ya no existe.'
  })
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  return mutate((draft) => {
    for (const section of draft.sections) {
      const index = section.items.findIndex((item) => item.id === id)
      if (index !== -1) {
        section.items.splice(index, 1)
        return
      }
    }
    return 'El producto ya no existe.'
  })
}

export async function moveProduct(id: string, direction: -1 | 1): Promise<ActionResult> {
  return mutate((draft) => {
    const section = draft.sections.find((entry) => entry.items.some((item) => item.id === id))
    if (section) move(section.items, section.items.findIndex((item) => item.id === id), direction)
  })
}

export async function setProductVisible(id: string, visible: boolean): Promise<ActionResult> {
  return mutate((draft) => {
    const item = draft.sections.flatMap((section) => section.items).find((entry) => entry.id === id)
    if (!item) return 'El producto ya no existe.'
    item.visible = visible
  })
}

// ───────────── Personaliza tu App ─────────────

export async function saveTheme(input: ThemeSettings): Promise<ActionResult> {
  // El tema se valida entero: nada que no sea una opción conocida llega al archivo ni al CSS.
  const theme = sanitizeTheme(input)
  return mutate((draft) => {
    draft.theme = theme
  })
}

// ───────────── Código QR ─────────────

export async function saveSiteUrl(value: string | null): Promise<ActionResult> {
  let siteUrl: string | null = null
  if (value?.trim()) {
    try {
      const url = new URL(value.trim())
      if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('protocolo')
      siteUrl = url.toString()
    } catch {
      return fail('Escribí una dirección válida, por ejemplo https://micarta.com')
    }
  }
  return mutate((draft) => {
    draft.siteUrl = siteUrl
  })
}
