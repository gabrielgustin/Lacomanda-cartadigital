import Image from 'next/image'
import { getCategoryIcon } from '@/lib/category-icons'
import { cn } from '@/lib/utils'

interface DishImageProps {
  /** Foto del plato. Sin foto se dibuja un recuadro con el ícono de la categoría (nunca la foto de otra cosa). */
  src: string | null | undefined
  /** Clave de ícono de la categoría (`lib/category-icons.ts`). */
  icon: string
  width: number
  height: number
  sizes: string
  className?: string
}

export function DishImage({ src, icon, width, height, sizes, className }: DishImageProps) {
  if (src) return <Image src={src} alt="" width={width} height={height} sizes={sizes} className={cn('object-cover', className)} />

  const Icon = getCategoryIcon(icon)
  // Mismo patrón de puntos que el encabezado de la carta, para que el hueco se sienta parte del diseño.
  return (
    <div aria-hidden className={cn('hero-pattern flex items-center justify-center bg-muted text-primary/40', className)}>
      <Icon className="h-[38%] w-[38%]" strokeWidth={1.5} />
    </div>
  )
}
