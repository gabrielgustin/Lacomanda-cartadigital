'use client'

import { DishImage } from '@/components/dish-image'
import { useLanguage } from '@/components/language-provider'
import { useOrder } from '@/components/order-provider'
import { useSiteTheme } from '@/components/site-theme'
import { QuantityStepper } from '@/components/quantity-stepper'
import { formatPrice } from '@/lib/format'
import type { MenuItem } from '@/lib/menu-data'

interface MenuItemCardProps {
  item: MenuItem
  /** Ícono de la categoría, para el recuadro de los platos sin foto. */
  icon: string
  /** Tarjeta chica para bebidas, tragos y vinos: foto, nombre y precio, sin descripción. */
  compact?: boolean
  onOpen: (item: MenuItem) => void
}

export function MenuItemCard({ item, icon, compact, onOpen }: MenuItemCardProps) {
  const { lang, t } = useLanguage()
  const { quantities, add, remove } = useOrder()
  const { itemStyle } = useSiteTheme()
  const name = item.name[lang]
  const description = item.description[lang]

  const title = (
    <h3 className="font-heading text-base text-heading group-hover:text-primary">
      {/* El botón cubre toda la tarjeta (after:inset-0); el stepper queda por encima con z-10. */}
      <button
        type="button"
        onClick={() => onOpen(item)}
        className="cursor-pointer break-words text-left [text-transform:inherit] outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-primary/50"
      >
        {name}
      </button>
    </h3>
  )

  const footer = (
    <div className="mt-3 flex items-center justify-between gap-3">
      <span className="font-heading text-base font-bold text-price">
        <span className="sr-only">{t.price} </span>
        {formatPrice(item.price)}
      </span>
      <div className="relative z-10">
        <QuantityStepper name={name} quantity={quantities[item.id] ?? 0} onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />
      </div>
    </div>
  )

  if (compact) {
    return (
      <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60">
        <DishImage
          src={item.image}
          icon={icon}
          width={320}
          height={320}
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 30vw, 46vw"
          className={`${item.image ? 'aspect-square' : 'aspect-[5/2]'} w-full transition duration-300 group-hover:scale-[1.02]`}
        />
        <div className="flex flex-1 flex-col justify-between gap-2 p-3">
          <h3 className="font-heading text-sm leading-tight text-heading group-hover:text-primary">
            <button
              type="button"
              onClick={() => onOpen(item)}
              className="cursor-pointer break-words text-left [text-transform:inherit] outline-none after:absolute after:inset-0 focus-visible:after:ring-2 focus-visible:after:ring-primary/50"
            >
              {name}
            </button>
          </h3>
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
            <span className="font-heading text-sm font-bold text-price">
              <span className="sr-only">{t.price} </span>
              {formatPrice(item.price)}
            </span>
            <div className="relative z-10">
              <QuantityStepper name={name} quantity={quantities[item.id] ?? 0} onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />
            </div>
          </div>
        </div>
      </article>
    )
  }

  if (itemStyle === 'cards') {
    return (
      <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition hover:border-primary/60">
        {item.image && (
          <DishImage
            src={item.image}
            icon={icon}
            width={480}
            height={360}
            sizes="(min-width: 640px) 480px, 100vw"
            className="aspect-[4/3] w-full transition duration-300 group-hover:scale-[1.02]"
          />
        )}
        <div className="flex flex-1 flex-col p-4">
          {title}
          <div className="flex-1">{description && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>}</div>
          {footer}
        </div>
      </article>
    )
  }

  return (
    <article className="group relative flex items-center gap-4 border-b border-border/70 py-4 transition hover:bg-muted/30">
      {itemStyle === 'list' && (
        <DishImage
          src={item.image}
          icon={icon}
          width={96}
          height={96}
          sizes="(min-width: 640px) 96px, 80px"
          className="h-20 w-20 shrink-0 rounded-xl ring-1 ring-border transition duration-300 group-hover:scale-[1.03] group-hover:ring-primary/60 sm:h-24 sm:w-24"
        />
      )}
      <div className="min-w-0 flex-1">
        {title}
        {description && <p className="mt-1.5 max-w-lg text-sm leading-6 text-muted-foreground">{description}</p>}
        {footer}
      </div>
    </article>
  )
}
