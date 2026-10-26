import { cache } from 'react'
import { query } from '@/lib/db'
import { seedMenu, type MenuItem, type MenuSection } from '@/lib/menu-data'
import { DEFAULT_SETTINGS, sanitizeSettings, type OrderSettings } from '@/lib/settings'
import { DEFAULT_THEME, sanitizeTheme, type ThemeSettings } from '@/lib/theme'

// La carta y toda su configuración viven en UNA fila de Postgres (tabla `store`, jsonb), en Neon.
// Cada guardado incrementa `version`: si dos personas editan a la vez, el segundo reintenta sobre lo nuevo.

export interface StoreData {
  sections: MenuSection[]
  theme: ThemeSettings
  /** Dirección pública de la carta, la que codifica el QR. Null = la del sitio actual. */
  siteUrl: string | null
  /** Horarios, medios de pago, cupones y datos del negocio. Nunca viaja entera al navegador del cliente. */
  settings: OrderSettings
}

const seed = (): StoreData => ({
  sections: structuredClone(seedMenu),
  theme: { ...DEFAULT_THEME },
  siteUrl: null,
  settings: structuredClone(DEFAULT_SETTINGS),
})

function normalize(raw: unknown): StoreData {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Partial<StoreData>
  if (!Array.isArray(data.sections)) return seed()
  return {
    sections: data.sections,
    theme: sanitizeTheme(data.theme),
    siteUrl: data.siteUrl ?? null,
    settings: sanitizeSettings(data.settings),
  }
}

async function loadRow() {
  const rows = await query<{ data: unknown; version: number }>('SELECT data, version FROM store WHERE id = 1')
  return rows[0] ? { data: normalize(rows[0].data), version: rows[0].version } : null
}

/**
 * Lectura ESTRICTA y fresca: si la base falla, lanza el error (nunca devuelve la carta base).
 * Es la que usan los pedidos, las escrituras y el backoffice: con datos inventados se cobrarían
 * precios falsos o se pisaría la configuración real al guardar.
 */
export async function loadStore(): Promise<StoreData> {
  return (await loadRow())?.data ?? seed()
}

/** Igual que `loadStore`, pero una sola lectura por visita (el layout y la página comparten el resultado). */
export const getStoreStrict = cache(loadStore)

/** Para la carta pública: si la base no responde, muestra la carta base en vez de romper la página. */
export const getStore = cache(async (): Promise<StoreData> => {
  try {
    return await loadStore()
  } catch (error) {
    console.error('[store] No se pudo leer la base de datos; se muestra la carta base.', error)
    return seed()
  }
})

const MAX_ATTEMPTS = 5

export async function updateStore<T>(mutate: (draft: StoreData) => T): Promise<T> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const current = await loadRow()
    const before = current ? JSON.stringify(current.data) : null
    const draft = current?.data ?? seed()
    const result = mutate(draft) // se vuelve a ejecutar sobre datos frescos si hay conflicto
    const json = JSON.stringify(draft)
    if (before === json) return result // nada que guardar

    const saved = current
      ? await query('UPDATE store SET data = $1::jsonb, version = version + 1, updated_at = now() WHERE id = 1 AND version = $2 RETURNING version', [json, current.version])
      : await query('INSERT INTO store (id, data) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING RETURNING version', [json])
    if (saved.length > 0) return result
  }
  throw new Error('No se pudo guardar: la carta se estaba editando al mismo tiempo desde otro lugar. Probá de nuevo.')
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
