// "Personaliza tu App": todo lo que el dueño puede cambiar del diseño de la carta.
// Un valor `null` significa "usar el diseño original" (globals.css), de modo que
// nada de lo predeterminado se pierde: personalizar es siempre una capa encima.

import type { Lang } from '@/lib/menu-data'

// ───────────── Colores ─────────────

export type ColorKey =
  | 'primary'
  | 'background'
  | 'card'
  | 'heroBg'
  | 'navBg'
  | 'footerBg'
  | 'foreground'
  | 'heading'
  | 'mutedText'
  | 'eyebrow'
  | 'price'
  | 'button'
  | 'buttonText'
  | 'pill'
  | 'pillText'
  | 'accent'
  | 'border'

export type ColorGroup = 'Fondos' | 'Textos' | 'Botones y categorías' | 'Detalles'

export interface ColorDef {
  key: ColorKey
  label: string
  hint: string
  group: ColorGroup
  /** Hex que se ve cuando el color es propio del diseño original. */
  fallback: string
  /** Mientras no se elija uno, copia el color de otra pieza. */
  inherits?: ColorKey
  /** Variable CSS principal (solo informativa para el editor). */
  automatic?: boolean
}

export const COLOR_DEFS: ColorDef[] = [
  { key: 'background', label: 'Fondo de la carta', hint: 'El color de fondo de toda la página.', group: 'Fondos', fallback: '#fbf6ee' },
  { key: 'card', label: 'Tarjetas, buscador y diálogos', hint: 'Fondo del buscador, de las categorías sin seleccionar y de las ventanas.', group: 'Fondos', fallback: '#fffdf9' },
  { key: 'heroBg', label: 'Encabezado (logo)', hint: 'Fondo de la franja donde va el logo.', group: 'Fondos', fallback: '#fbf6ee', inherits: 'background' },
  { key: 'navBg', label: 'Barra de categorías', hint: 'Fondo de la barra que queda fija al bajar.', group: 'Fondos', fallback: '#fbf6ee', inherits: 'background' },
  { key: 'footerBg', label: 'Pie de página', hint: 'Fondo de la franja final.', group: 'Fondos', fallback: '#fffdf9', inherits: 'card' },

  { key: 'foreground', label: 'Texto principal', hint: 'Textos generales de la carta.', group: 'Textos', fallback: '#231410' },
  { key: 'heading', label: 'Títulos', hint: 'Nombres de los platos y títulos de sección.', group: 'Textos', fallback: '#231410', inherits: 'foreground' },
  { key: 'mutedText', label: 'Texto secundario', hint: 'Descripciones y textos de apoyo.', group: 'Textos', fallback: '#6b5b52', automatic: true },
  { key: 'eyebrow', label: 'Frases cortas y etiquetas', hint: 'El texto chico que va sobre cada título.', group: 'Textos', fallback: '#43281c', inherits: 'primary' },
  { key: 'price', label: 'Precios', hint: 'El color de todos los precios.', group: 'Textos', fallback: '#43281c', inherits: 'primary' },

  { key: 'primary', label: 'Color principal', hint: 'El color de la marca: sirve de base para botones, categoría activa, precios y etiquetas.', group: 'Botones y categorías', fallback: '#43281c' },
  { key: 'button', label: 'Botones', hint: 'Botones “+”, “Agregar al pedido” y barra del pedido.', group: 'Botones y categorías', fallback: '#43281c', inherits: 'primary' },
  { key: 'buttonText', label: 'Texto de los botones', hint: 'Se elige solo según el color del botón.', group: 'Botones y categorías', fallback: '#fffaf4', automatic: true },
  { key: 'pill', label: 'Categoría activa', hint: 'La categoría seleccionada en la barra.', group: 'Botones y categorías', fallback: '#43281c', inherits: 'primary' },
  { key: 'pillText', label: 'Texto de la categoría activa', hint: 'Se elige solo según el color de la categoría.', group: 'Botones y categorías', fallback: '#fffaf4', automatic: true },

  { key: 'accent', label: 'Brillo de la categoría activa', hint: 'El destello que recorre la categoría al seleccionarla.', group: 'Detalles', fallback: '#c9915f' },
  { key: 'border', label: 'Bordes y divisores', hint: 'Líneas que separan las secciones.', group: 'Detalles', fallback: '#e7dccd', automatic: true },
]

export const COLOR_KEYS = COLOR_DEFS.map((def) => def.key)

export const HEX_COLOR = /^#[0-9a-f]{6}$/i

const hexToRgb = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16))
const rgbToHex = (rgb: number[]) => `#${rgb.map((value) => Math.round(value).toString(16).padStart(2, '0')).join('')}`

/** Mezcla dos colores como `color-mix(in srgb)`: `percent` % del primero. */
export const mixHex = (a: string, b: string, percent: number) => {
  const [first, second] = [hexToRgb(a), hexToRgb(b)]
  return rgbToHex(first.map((value, index) => (value * percent) / 100 + second[index] * (1 - percent / 100)))
}

const luminance = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map((value) => {
    const channel = value / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contraste WCAG entre dos colores hex (1 a 21). */
export const contrastRatio = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

// Texto claro u oscuro según el color de fondo del botón.
export const readableOn = (hex: string) => (luminance(hex) > 0.4 ? '#1f1410' : '#fffaf4')

// ───────────── Tipografías ─────────────

export interface FontDef {
  name: string
  kind: 'Con serifa' | 'Sin serifa' | 'Impacto' | 'Manuscrita'
  /** Pesos que existen en Google Fonts (pedir uno inexistente rompe la hoja de estilos). */
  weights: string
}

export const FONTS: FontDef[] = [
  { name: 'Bevan', kind: 'Impacto', weights: '400' },
  { name: 'Playfair Display', kind: 'Con serifa', weights: '400;500;600;700' },
  { name: 'DM Serif Display', kind: 'Con serifa', weights: '400' },
  { name: 'Cinzel', kind: 'Con serifa', weights: '400;500;600;700' },
  { name: 'Lora', kind: 'Con serifa', weights: '400;500;600;700' },
  { name: 'Merriweather', kind: 'Con serifa', weights: '400;700' },
  { name: 'Fraunces', kind: 'Con serifa', weights: '400;500;600;700' },
  { name: 'Abril Fatface', kind: 'Impacto', weights: '400' },
  { name: 'Oswald', kind: 'Impacto', weights: '400;500;600;700' },
  { name: 'Bebas Neue', kind: 'Impacto', weights: '400' },
  { name: 'Anton', kind: 'Impacto', weights: '400' },
  { name: 'Archivo Black', kind: 'Impacto', weights: '400' },
  { name: 'Lobster', kind: 'Manuscrita', weights: '400' },
  { name: 'Pacifico', kind: 'Manuscrita', weights: '400' },
  { name: 'Caveat', kind: 'Manuscrita', weights: '400;500;600;700' },
  { name: 'DM Sans', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Inter', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Poppins', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Montserrat', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Raleway', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Nunito', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Work Sans', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Open Sans', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Source Sans 3', kind: 'Sin serifa', weights: '400;500;600;700' },
  { name: 'Lato', kind: 'Sin serifa', weights: '400;700' },
  { name: 'Roboto', kind: 'Sin serifa', weights: '400;500;700' },
]

export const DEFAULT_HEADING_FONT = 'Bevan'
export const DEFAULT_BODY_FONT = 'DM Sans'

const fontByName = (name: string) => FONTS.find((font) => font.name === name)

export const googleFontsHref = (names: string[]) => {
  const families = names
    .map(fontByName)
    .filter((font): font is FontDef => Boolean(font))
    .map((font) => `family=${font.name.replace(/ /g, '+')}:wght@${font.weights}`)
  return families.length ? `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap` : null
}

/** Hoja de Google Fonts que hace falta cargar para la tipografía elegida (null = la original, ya incluida). */
export const themeFontsHref = (theme: Pick<ThemeSettings, 'headingFont' | 'bodyFont'>) =>
  googleFontsHref([theme.headingFont, theme.bodyFont].filter((name): name is string => Boolean(name)))

// ───────────── Opciones de estilo ─────────────

export interface Option<T extends string | number> {
  value: T
  label: string
  hint?: string
}

export const HEADING_CASES: Option<'upper' | 'normal'>[] = [
  { value: 'upper', label: 'MAYÚSCULAS', hint: 'Original' },
  { value: 'normal', label: 'Normal', hint: 'Como se escribe' },
]
export const HEADING_SPACINGS: Option<'compact' | 'normal' | 'wide'>[] = [
  { value: 'compact', label: 'Junto' },
  { value: 'normal', label: 'Normal', hint: 'Original' },
  { value: 'wide', label: 'Separado' },
]
export const TEXT_SCALES: Option<'sm' | 'md' | 'lg'>[] = [
  { value: 'sm', label: 'Chico' },
  { value: 'md', label: 'Normal', hint: 'Original' },
  { value: 'lg', label: 'Grande' },
]
export const CORNERS: Option<'square' | 'soft' | 'round' | 'extra'>[] = [
  { value: 'square', label: 'Rectos' },
  { value: 'soft', label: 'Suaves' },
  { value: 'round', label: 'Redondeados', hint: 'Original' },
  { value: 'extra', label: 'Muy redondeados' },
]
export const BUTTONS: Option<'pill' | 'rounded' | 'square'>[] = [
  { value: 'pill', label: 'Píldora', hint: 'Original' },
  { value: 'rounded', label: 'Redondeados' },
  { value: 'square', label: 'Rectos' },
]
export const LOGO_SHAPES: Option<'circle' | 'rounded' | 'square'>[] = [
  { value: 'circle', label: 'Círculo', hint: 'Original' },
  { value: 'rounded', label: 'Redondeado' },
  { value: 'square', label: 'Cuadrado' },
]
export const LOGO_SIZES: Option<'sm' | 'md' | 'lg'>[] = [
  { value: 'sm', label: 'Chico' },
  { value: 'md', label: 'Mediano', hint: 'Original' },
  { value: 'lg', label: 'Grande' },
]
export const LOGO_FITS: Option<'cover' | 'contain'>[] = [
  { value: 'cover', label: 'Llenar', hint: 'Recorta los bordes' },
  { value: 'contain', label: 'Mostrar entero', hint: 'Sin recortar' },
]
export const ITEM_STYLES: Option<'list' | 'cards' | 'text'>[] = [
  { value: 'list', label: 'Lista', hint: 'Foto chica al costado. Original' },
  { value: 'cards', label: 'Tarjetas', hint: 'Foto grande arriba' },
  { value: 'text', label: 'Solo texto', hint: 'Sin fotos' },
]
export const COLUMNS: Option<1 | 2>[] = [
  { value: 2, label: '2 columnas', hint: 'En pantallas anchas. Original' },
  { value: 1, label: '1 columna' },
]
export const CONTENT_WIDTHS: Option<'narrow' | 'normal' | 'wide'>[] = [
  { value: 'narrow', label: 'Angosto' },
  { value: 'normal', label: 'Normal', hint: 'Original' },
  { value: 'wide', label: 'Ancho' },
]

// ───────────── Textos editables ─────────────

export type TextKey = 'searchPlaceholder' | 'viewOrder' | 'addToOrder' | 'orderTitle' | 'orderHint' | 'estimatedTotal'

export const TEXT_DEFS: { key: TextKey; label: string; where: string; es: string; en: string; multiline?: boolean }[] = [
  { key: 'searchPlaceholder', label: 'Texto del buscador', where: 'Dentro de la barra de búsqueda', es: '¿Qué tenés ganas de comer?', en: 'What are you in the mood for?' },
  { key: 'addToOrder', label: 'Botón de agregar', where: 'En la ficha de cada plato', es: 'Agregar al pedido', en: 'Add to order' },
  { key: 'viewOrder', label: 'Botón del pedido', where: 'Barra fija al agregar platos', es: 'Ver pedido', en: 'View order' },
  { key: 'orderTitle', label: 'Título del pedido', where: 'Ventana con el resumen', es: 'Mi pedido', en: 'My order' },
  { key: 'orderHint', label: 'Mensaje del pedido', where: 'Bajo el título del resumen', es: 'Revisá tu pedido y ajustá las cantidades. Después elegís cómo lo querés.', en: 'Review your order and adjust the quantities. Then choose how you want it.', multiline: true },
  { key: 'estimatedTotal', label: 'Etiqueta del total', where: 'Al pie del resumen', es: 'Total estimado', en: 'Estimated total' },
]

export type TextOverrides = Partial<Record<TextKey, Partial<Record<Lang, string>>>>

// ───────────── Modelo del tema ─────────────

export interface ThemeSettings extends Record<ColorKey, string | null> {
  headingFont: string | null
  bodyFont: string | null
  headingCase: 'upper' | 'normal'
  headingSpacing: 'compact' | 'normal' | 'wide'
  textScale: 'sm' | 'md' | 'lg'
  corners: 'square' | 'soft' | 'round' | 'extra'
  buttons: 'pill' | 'rounded' | 'square'
  logoShape: 'circle' | 'rounded' | 'square'
  logoSize: 'sm' | 'md' | 'lg'
  logoFit: 'cover' | 'contain'
  itemStyle: 'list' | 'cards' | 'text'
  columns: 1 | 2
  contentWidth: 'narrow' | 'normal' | 'wide'
  heroPattern: boolean
  showSearch: boolean
  showLanguage: boolean
  showCategoryIcons: boolean
  showFooterImage: boolean
  logoUrl: string | null
  heroImageUrl: string | null
  footerUrl: string | null
  faviconUrl: string | null
  shareImageUrl: string | null
  siteName: string | null
  siteDescription: string | null
  texts: TextOverrides
}

export const DEFAULT_LOGO_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logolacomanda-VNpRbPJh01Eae6IUkvUaEkNgdUZQTm.webp'
export const DEFAULT_FOOTER_URL =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/n-lVCemyWt8jQsqth5SSB8kXA3IgLsyn.png'
export const DEFAULT_FAVICON_URL = '/logo-la-comanda.svg'
export const DEFAULT_SITE_NAME = 'La Comanda'
export const DEFAULT_SITE_DESCRIPTION = 'Carta digital de La Comanda. Sabores honestos para compartir.'

export const DEFAULT_THEME: ThemeSettings = {
  ...(Object.fromEntries(COLOR_KEYS.map((key) => [key, null])) as Record<ColorKey, null>),
  headingFont: null,
  bodyFont: null,
  headingCase: 'upper',
  headingSpacing: 'normal',
  textScale: 'md',
  corners: 'round',
  buttons: 'pill',
  logoShape: 'circle',
  logoSize: 'md',
  logoFit: 'cover',
  itemStyle: 'list',
  columns: 2,
  contentWidth: 'normal',
  heroPattern: true,
  showSearch: true,
  showLanguage: true,
  showCategoryIcons: true,
  showFooterImage: true,
  logoUrl: null,
  heroImageUrl: null,
  footerUrl: null,
  faviconUrl: null,
  shareImageUrl: null,
  siteName: null,
  siteDescription: null,
  texts: {},
}

/** Claves de apariencia: lo que cambia una plantilla (no toca imágenes ni textos). */
export const STYLE_KEYS = [
  ...COLOR_KEYS,
  'headingFont',
  'bodyFont',
  'headingCase',
  'headingSpacing',
  'textScale',
  'corners',
  'buttons',
  'logoShape',
  'logoSize',
  'logoFit',
  'itemStyle',
  'columns',
  'contentWidth',
  'heroPattern',
  'showSearch',
  'showLanguage',
  'showCategoryIcons',
  'showFooterImage',
] as const satisfies readonly (keyof ThemeSettings)[]

const UPLOAD_PATH = /^\/media\/[\w.-]+$/

const oneOf = <T extends string | number>(value: unknown, options: readonly Option<T>[], fallback: T): T =>
  options.some((option) => option.value === value) ? (value as T) : fallback

const text = (value: unknown, max: number) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim().slice(0, max)
  return trimmed || null
}

/**
 * Convierte cualquier valor en un tema válido. Se usa al leer el archivo, al
 * guardar y al recibir la vista previa en vivo, así que nada que no sea una
 * opción conocida llega nunca al CSS.
 */
export function sanitizeTheme(input: unknown): ThemeSettings {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>
  const theme: ThemeSettings = { ...DEFAULT_THEME, texts: {} }

  for (const key of COLOR_KEYS) {
    const value = raw[key]
    theme[key] = typeof value === 'string' && HEX_COLOR.test(value) ? value.toLowerCase() : null
  }

  const font = (value: unknown, original: string) =>
    typeof value === 'string' && fontByName(value) && value !== original ? value : null
  theme.headingFont = font(raw.headingFont, DEFAULT_HEADING_FONT)
  theme.bodyFont = font(raw.bodyFont, DEFAULT_BODY_FONT)

  theme.headingCase = oneOf(raw.headingCase, HEADING_CASES, 'upper')
  theme.headingSpacing = oneOf(raw.headingSpacing, HEADING_SPACINGS, 'normal')
  theme.textScale = oneOf(raw.textScale, TEXT_SCALES, 'md')
  theme.corners = oneOf(raw.corners, CORNERS, 'round')
  theme.buttons = oneOf(raw.buttons, BUTTONS, 'pill')
  theme.logoShape = oneOf(raw.logoShape, LOGO_SHAPES, 'circle')
  theme.logoSize = oneOf(raw.logoSize, LOGO_SIZES, 'md')
  theme.logoFit = oneOf(raw.logoFit, LOGO_FITS, 'cover')
  theme.itemStyle = oneOf(raw.itemStyle, ITEM_STYLES, 'list')
  theme.columns = oneOf(raw.columns, COLUMNS, 2)
  theme.contentWidth = oneOf(raw.contentWidth, CONTENT_WIDTHS, 'normal')

  for (const key of ['heroPattern', 'showSearch', 'showLanguage', 'showCategoryIcons', 'showFooterImage'] as const) {
    theme[key] = typeof raw[key] === 'boolean' ? raw[key] : DEFAULT_THEME[key]
  }

  for (const key of ['logoUrl', 'heroImageUrl', 'footerUrl', 'faviconUrl', 'shareImageUrl'] as const) {
    const value = raw[key]
    theme[key] = typeof value === 'string' && UPLOAD_PATH.test(value) ? value : null
  }

  theme.siteName = text(raw.siteName, 60)
  theme.siteDescription = text(raw.siteDescription, 200)

  const texts = (raw.texts && typeof raw.texts === 'object' ? raw.texts : {}) as Record<string, unknown>
  for (const { key } of TEXT_DEFS) {
    const entry = (texts[key] && typeof texts[key] === 'object' ? texts[key] : {}) as Record<string, unknown>
    const es = text(entry.es, 200)
    const en = text(entry.en, 200)
    if (es || en) theme.texts[key] = { ...(es && { es }), ...(en && { en }) }
  }

  return theme
}

// ───────────── Colores efectivos ─────────────

/** El color que realmente se ve, sea propio o heredado de otra pieza. */
export function resolveColor(theme: Pick<ThemeSettings, ColorKey>, key: ColorKey): string {
  const own = theme[key]
  if (own) return own
  const background = () => resolveColor(theme, 'background')
  const foreground = () => resolveColor(theme, 'foreground')

  if (key === 'mutedText') return mixHex(foreground(), background(), 62)
  if (key === 'border') return mixHex(foreground(), background(), 14)
  if (key === 'buttonText') return readableOn(resolveColor(theme, 'button'))
  if (key === 'pillText') return readableOn(resolveColor(theme, 'pill'))

  const def = COLOR_DEFS.find((entry) => entry.key === key)!
  return def.inherits ? resolveColor(theme, def.inherits) : def.fallback
}

// ───────────── CSS ─────────────

const RADIUS_MEDIA = { square: '0px', soft: '0.375rem', round: '0.75rem', extra: '1.25rem' }
const RADIUS_SHEET = { square: '0px', soft: '0.5rem', round: '1.5rem', extra: '2rem' }
const RADIUS_BUTTON = { pill: '9999px', rounded: '0.75rem', square: '0px' }
const RADIUS_LOGO = { circle: '9999px', rounded: '1.5rem', square: '0px' }
const LOGO_REM = { sm: ['8rem', '9rem'], md: ['11rem', '13rem'], lg: ['14rem', '17rem'] }
const TRACKING = { compact: '0em', normal: '0.025em', wide: '0.08em' }
const SCALE = { sm: '93.75%', md: '100%', lg: '112.5%' }
const WIDTH = { narrow: '56rem', normal: '72rem', wide: '88rem' }

/** Variables CSS del tema: solo las que se apartan del diseño original. */
export function themeVariables(theme: ThemeSettings): Record<string, string> {
  const vars: Record<string, string> = {}
  const set = (name: string, value: string | null) => {
    if (value) vars[name] = value
  }

  // Colores
  if (theme.primary) {
    vars['--primary'] = theme.primary
    vars['--primary-foreground'] = readableOn(theme.primary)
  }
  set('--background', theme.background)
  set('--foreground', theme.foreground)
  set('--card', theme.card)
  set('--hero-bg', theme.heroBg)
  set('--nav-bg', theme.navBg)
  set('--footer-bg', theme.footerBg)
  set('--heading', theme.heading)
  set('--eyebrow', theme.eyebrow)
  set('--price', theme.price)
  set('--accent', theme.accent)
  if (theme.button) {
    vars['--button'] = theme.button
    vars['--button-foreground'] = theme.buttonText ?? readableOn(theme.button)
  } else set('--button-foreground', theme.buttonText)
  if (theme.pill) {
    vars['--pill'] = theme.pill
    vars['--pill-foreground'] = theme.pillText ?? readableOn(theme.pill)
  } else set('--pill-foreground', theme.pillText)

  // Tonos derivados: cambian si cambia el fondo o el texto, salvo que se elijan a mano.
  const fg = theme.foreground ?? 'var(--foreground)'
  const bg = theme.background ?? 'var(--background)'
  if (theme.background || theme.foreground) {
    vars['--muted'] = `color-mix(in srgb, ${fg} 7%, ${bg})`
    vars['--muted-foreground'] = `color-mix(in srgb, ${fg} 62%, ${bg})`
    vars['--border'] = `color-mix(in srgb, ${fg} 14%, ${bg})`
    vars['--input'] = vars['--border']
  }
  if (theme.mutedText) vars['--muted-foreground'] = theme.mutedText
  if (theme.border) {
    vars['--border'] = theme.border
    vars['--input'] = theme.border
  }

  // Tipografía
  if (theme.headingFont) vars['--font-heading'] = `"${theme.headingFont}"`
  if (theme.bodyFont) vars['--font-body'] = `"${theme.bodyFont}"`
  if (theme.headingCase !== 'upper') vars['--heading-case'] = 'none'
  if (theme.headingSpacing !== 'normal') vars['--heading-tracking'] = TRACKING[theme.headingSpacing]

  // Formas
  if (theme.corners !== 'round') {
    vars['--radius-xl'] = RADIUS_MEDIA[theme.corners]
    vars['--radius-3xl'] = RADIUS_SHEET[theme.corners]
  }
  if (theme.buttons !== 'pill') vars['--radius-pill'] = RADIUS_BUTTON[theme.buttons]
  if (theme.logoShape !== 'circle') vars['--radius-logo'] = RADIUS_LOGO[theme.logoShape]
  if (theme.logoSize !== 'md') {
    vars['--logo-size'] = LOGO_REM[theme.logoSize][0]
    vars['--logo-size-sm'] = LOGO_REM[theme.logoSize][1]
  }
  if (theme.contentWidth !== 'normal') vars['--content-width'] = WIDTH[theme.contentWidth]
  if (!theme.heroPattern) vars['--hero-pattern-image'] = 'none'

  return vars
}

export function themeCss(theme: ThemeSettings): string {
  const entries = Object.entries(themeVariables(theme))
  const rules = []
  if (entries.length) rules.push(`:root{${entries.map(([key, value]) => `${key}:${value}`).join(';')}}`)
  if (theme.textScale !== 'md') rules.push(`html{font-size:${SCALE[theme.textScale]}}`)
  return rules.join('\n')
}

// ───────────── Plantillas ─────────────

export interface ThemePreset {
  id: string
  name: string
  description: string
  patch: Partial<ThemeSettings>
}

export const PRESETS: ThemePreset[] = [
  { id: 'original', name: 'La Comanda', description: 'El diseño original de la carta.', patch: {} },
  {
    id: 'oscuro',
    name: 'Noche',
    description: 'Fondo oscuro con detalles dorados.',
    patch: { background: '#15110f', card: '#211c19', foreground: '#f4ece2', primary: '#d9a05b', accent: '#f0c98b', headingFont: 'Playfair Display', bodyFont: 'Inter', headingCase: 'normal', corners: 'soft' },
  },
  {
    id: 'fresco',
    name: 'Fresco',
    description: 'Verdes suaves, redondeado y amigable.',
    patch: { background: '#f3f8f1', card: '#ffffff', foreground: '#1d2b21', primary: '#2f7d4a', accent: '#8fcf9f', headingFont: 'Poppins', bodyFont: 'Poppins', headingCase: 'normal', buttons: 'rounded' },
  },
  {
    id: 'moderno',
    name: 'Moderno',
    description: 'Blanco y azul, con tarjetas grandes.',
    patch: { background: '#f8fafc', card: '#ffffff', foreground: '#0f172a', primary: '#2563eb', accent: '#93c5fd', headingFont: 'Inter', bodyFont: 'Inter', headingCase: 'normal', headingSpacing: 'compact', buttons: 'rounded', corners: 'soft', itemStyle: 'cards', heroPattern: false },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    description: 'Papel crema y rojo bodegón.',
    patch: { background: '#f4ead7', card: '#fbf4e4', foreground: '#2b1d14', primary: '#9b2c2c', accent: '#d9a441', headingFont: 'Abril Fatface', bodyFont: 'Lora', buttons: 'rounded', corners: 'soft' },
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Blanco y negro, solo texto.',
    patch: { background: '#ffffff', card: '#ffffff', foreground: '#111111', primary: '#111111', accent: '#8a8a8a', headingFont: 'Montserrat', bodyFont: 'Montserrat', headingSpacing: 'wide', buttons: 'square', corners: 'square', itemStyle: 'text', heroPattern: false },
  },
]

/** Aplica una plantilla sobre el tema: cambia la apariencia pero conserva imágenes y textos. */
export function applyPreset(theme: ThemeSettings, preset: ThemePreset): ThemeSettings {
  const next: ThemeSettings = { ...theme }
  for (const key of STYLE_KEYS) (next as unknown as Record<string, unknown>)[key] = DEFAULT_THEME[key]
  return sanitizeTheme({ ...next, ...preset.patch })
}
