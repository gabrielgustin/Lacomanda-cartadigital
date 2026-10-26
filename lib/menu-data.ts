import seed from '@/lib/menu-seed.json'

export type Lang = 'es' | 'en'
export type Localized = Record<Lang, string>

export interface MenuItem {
  id: string
  sectionId: string
  name: Localized
  description: Localized
  price: number
  /** Foto propia del plato. Sin foto, la carta muestra un recuadro con el ícono de su categoría. */
  image?: string
  /** Subcategoría dentro de la categoría (ej. "Tradicionales", "Para 2"). Los platos de una misma subcategoría van seguidos. */
  group?: Localized
  /** Tamaño en porciones (pizzas). Si la categoría tiene platos con tamaño, la carta muestra un selector 8 / 4. */
  portions?: 4 | 8
  /** Un plato oculto no aparece en la carta pública. */
  visible: boolean
}

export interface MenuSection {
  id: string
  label: Localized
  title: Localized
  eyebrow: Localized
  image: string
  /** Clave de `lib/category-icons.ts`. */
  icon: string
  /** Una categoría oculta no aparece en la carta pública. */
  visible: boolean
  /** `compact`: dos columnas en el celular, solo foto, nombre y precio (para bebidas, tragos, vinos). */
  layout?: 'compact'
  items: MenuItem[]
}

/**
 * Carta inicial (datos en `lib/menu-seed.json`): se usa hasta que el backoffice guarda cambios por
 * primera vez. Los platos sin precio cargado (0) y los que solo existían en Pedix están ocultos.
 */
export const seedMenu = seed as MenuSection[]
