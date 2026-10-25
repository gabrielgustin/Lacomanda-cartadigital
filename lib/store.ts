import { promises as fs } from 'node:fs'
import path from 'node:path'
import { seedMenu, type MenuItem, type MenuSection } from '@/lib/menu-data'
import { DEFAULT_SETTINGS, sanitizeSettings, type OrderSettings } from '@/lib/settings'
import { DEFAULT_THEME, sanitizeTheme, type ThemeSettings } from '@/lib/theme'

// Persistencia en un archivo JSON local: simple y sin servicios externos.
// OJO: en hosts de solo lectura (p. ej. Vercel) se puede leer pero no guardar.

export interface StoreData {
  sections: MenuSection[]
  theme: ThemeSettings
  /** Dirección pública de la carta, la que codifica el QR. Null = la del sitio actual. */
  siteUrl: string | null
  /** Horarios, medios de pago, cupones y datos del negocio. Nunca viaja entera al navegador del cliente. */
  settings: OrderSettings
}

export const DATA_DIR = path.join(process.cwd(), 'data')
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads')
const STORE_FILE = path.join(DATA_DIR, 'store.json')

const seed = (): StoreData => ({
  sections: structuredClone(seedMenu),
  theme: { ...DEFAULT_THEME },
  siteUrl: null,
  settings: structuredClone(DEFAULT_SETTINGS),
})

export async function getStore(): Promise<StoreData> {
  try {
    const raw = JSON.parse(await fs.readFile(STORE_FILE, 'utf8')) as Partial<StoreData>
    if (!Array.isArray(raw.sections)) return seed()
    return {
      sections: raw.sections,
      theme: sanitizeTheme(raw.theme),
      siteUrl: raw.siteUrl ?? null,
      settings: sanitizeSettings(raw.settings),
    }
  } catch {
    return seed()
  }
}

// Las escrituras se encolan para que dos guardados seguidos no se pisen.
let queue: Promise<unknown> = Promise.resolve()

export function updateStore<T>(mutate: (draft: StoreData) => T): Promise<T> {
  const run = async () => {
    const draft = await getStore()
    const result = mutate(draft)
    await fs.mkdir(DATA_DIR, { recursive: true })
    const tmp = `${STORE_FILE}.${process.pid}.tmp`
    await fs.writeFile(tmp, JSON.stringify(draft, null, 2))
    await fs.rename(tmp, STORE_FILE)
    return result
  }
  const next = queue.then(run, run)
  queue = next.catch(() => {})
  return next
}

/** Lo que ve el cliente en la carta pública: solo categorías y platos visibles. */
export function publicSections(sections: MenuSection[]): MenuSection[] {
  return sections
    .filter((section) => section.visible)
    .map((section) => ({ ...section, items: section.items.filter((item) => item.visible) }))
    .filter((section) => section.items.length > 0)
}

export function indexItems(sections: MenuSection[]): Record<string, MenuItem> {
  return Object.fromEntries(sections.flatMap((section) => section.items.map((item) => [item.id, item] as const)))
}
