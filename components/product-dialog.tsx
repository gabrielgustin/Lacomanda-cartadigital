'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Modal } from '@/components/modal'
import { useOrder } from '@/components/order-provider'
import { QuantityStepper } from '@/components/quantity-stepper'
import { formatPrice } from '@/lib/format'
import type { MenuItem, MenuSection } from '@/lib/menu-data'

interface ProductDialogProps {
  item: MenuItem
  section: MenuSection
  onClose: () => void
}

const primaryButton =
  'h-11 w-full rounded-pill bg-button px-5 text-sm font-semibold text-button-foreground transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function ProductDialog({ item, section, onClose }: ProductDialogProps) {
  const { lang, t } = useLanguage()
  const { quantities, add, remove } = useOrder()
  const quantity = quantities[item.id] ?? 0
  const name = item.name[lang]

  return (
    <Modal labelledBy="product-dialog-title" onClose={onClose}>
      {(close) => (
        <>
          <div className={`relative ${item.image ? 'h-52 sm:h-60' : ''}`}>
            {item.image && <Image src={item.image} alt="" fill sizes="448px" className="object-cover" />}
            <button
              type="button"
              onClick={close}
              aria-label={t.closeDetails}
              className="absolute right-4 top-4 z-10 rounded-pill bg-card/90 p-2 text-foreground shadow-md transition hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className={`space-y-3 p-6 ${item.image ? '' : 'pr-16'}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{section.title[lang]}
              {item.group && `, ${item.group[lang].toLowerCase()}`}
            </p>
            <div className="flex items-start justify-between gap-4">
              <h2 id="product-dialog-title" className="font-heading text-2xl text-heading">
                {name}
              </h2>
              <span className="shrink-0 pt-1 font-heading text-lg font-bold text-price">
                <span className="sr-only">{t.price} </span>
                {formatPrice(item.price)}
              </span>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{item.description[lang]}</p>
            <div className="space-y-3 pt-2">
              {quantity === 0 ? (
                // Primera vez: suma uno y cierra la ventana.
                <button
                  type="button"
                  onClick={() => {
                    add(item.id)
                    close()
                  }}
                  className={primaryButton}
                >
                  {t.addToOrder}
                </button>
              ) : (
                // Ya está en el pedido: se ajusta la cantidad con − y +, y "Listo" cierra.
                <>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.inYourOrder}</span>
                    <QuantityStepper name={name} quantity={quantity} onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />
                  </div>
                  <button type="button" onClick={close} className={primaryButton}>
                    {t.done}
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </Modal>
  )
}
