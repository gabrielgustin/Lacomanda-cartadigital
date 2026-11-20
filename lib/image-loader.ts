import { withBase } from '@/lib/base-path'

// Igual que el cargador por defecto, pero las imágenes locales (/menu/…, /media/…) se piden bajo /carta.
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  return `${withBase('/_next/image')}?url=${encodeURIComponent(withBase(src))}&w=${width}&q=${quality ?? 75}`
}
