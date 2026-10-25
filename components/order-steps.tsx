'use client'

import Link from 'next/link'
import { ArrowLeft, ShoppingBag, Utensils, X } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import type { OrderLine } from '@/components/order-provider'
import { formatPrice } from '@/lib/format'
import type { MenuSection } from '@/lib/menu-data'

interface StepHeaderProps {
  id: string
  title: string
  hint?: string
  onBack: () => void
  onClose: () => void
}

function StepHeader({ id, title, hint, onBack, onClose }: StepHeaderProps) {
  const { t } = useLanguage()
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border p-6 pb-4">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="mt-1 shrink-0 rounded-pill bg-muted p-2 text-foreground transition hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <div>
          <h2 id={id} className="font-heading text-2xl text-heading">
            {title}
          </h2>
          {hint && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t.closeOrder}
        className="shrink-0 rounded-pill bg-muted p-2 text-foreground transition hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
    </div>
  )
}

const optionClass =
  'group flex w-full items-center gap-4 rounded-3xl border border-border bg-card p-4 text-left transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60'

/** Paso 2 de "Cerrar pedido": salón (lo toma el mozo) o para llevar (pasa a cargar los datos). */
export function OrderTypeStep({ onBack, onClose, onDineIn }: { onBack: () => void; onClose: () => void; onDineIn: () => void }) {
  const { t } = useLanguage()
  return (
    <div>
      <StepHeader id="order-dialog-title" title={t.orderTypeTitle} onBack={onBack} onClose={onClose} />
      <div className="space-y-3 p-6">
        <button type="button" onClick={onDineIn} className={optionClass} data-autofocus>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-button text-button-foreground">
            <Utensils className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-heading text-base text-heading">{t.dineIn}</span>
            <span className="mt-1 block text-sm leading-5 text-muted-foreground">{t.dineInHint}</span>
          </span>
        </button>
        <Link href="/finalizar-pedido" className={optionClass}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-button text-button-foreground">
            <ShoppingBag className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-heading text-base text-heading">{t.takeaway}</span>
            <span className="mt-1 block text-sm leading-5 text-muted-foreground">{t.takeawayHint}</span>
          </span>
        </Link>
      </div>
    </div>
  )
}

interface DineInStepProps {
  groups: { section: MenuSection; lines: OrderLine[] }[]
  total: number
  /** Volver a editar el pedido (el pedido deja de estar marcado como "para el salón"). */
  onEdit: () => void
  /** Ya se tocó "Listo": desde ahí solo se ofrece "Modificar pedido". */
  confirmed: boolean
  /** "Listo": deja el pedido confirmado y cierra la ventana. */
  onConfirm: () => void
  onClose: () => void
}

/** Pedido para el salón: resumen de solo lectura para mostrarle al mozo. No se guarda ni se envía. */
export function DineInStep({ groups, total, onEdit, confirmed, onConfirm, onClose }: DineInStepProps) {
  const { lang, t } = useLanguage()
  return (
    <div>
      <StepHeader id="order-dialog-title" title={t.dineInTitle} hint={t.dineInShow} onBack={onEdit} onClose={onClose} />
      <div className="space-y-5 px-6 pt-4">
        {groups.map(({ section, lines }) => (
          <section key={section.id} aria-label={section.title[lang]}>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">{section.title[lang]}</h3>
            <ul className="divide-y divide-border/70">
              {lines.map(({ item, quantity }) => (
                <li key={item.id} className="flex items-baseline justify-between gap-3 py-3">
                  <p className="font-heading text-sm text-heading">
                    <span className="mr-2 tabular-nums text-price">{quantity}×</span>
                    {item.name[lang]}
                  </p>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatPrice(item.price * quantity)}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="space-y-3 border-t border-border p-6">
        <p className="flex items-baseline justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t.estimatedTotal}</span>
          <span className="font-heading text-xl text-price">{formatPrice(total)}</span>
        </p>
        {!confirmed && (
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 w-full rounded-pill bg-button px-5 text-sm font-semibold text-button-foreground transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t.done}
          </button>
        )}
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-pill border border-border py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          {t.editOrder}
        </button>
      </div>
    </div>
  )
}
