'use client'

import { useState } from 'react'
import { ClipboardList, X } from 'lucide-react'
import { useLanguage } from '@/components/language-provider'
import { Modal } from '@/components/modal'
import { DineInStep, OrderTypeStep } from '@/components/order-steps'
import { useOrder } from '@/components/order-provider'
import { QuantityStepper } from '@/components/quantity-stepper'
import { formatPrice } from '@/lib/format'

// Barra fija con el resumen del pedido + hoja con el detalle para mostrarle al mozo.
export function OrderBar() {
  const { lang, t } = useLanguage()
  const { sections, lines, count, total, add, remove, clear } = useOrder()
  const [open, setOpen] = useState(false)
  // Cerrar el pedido: lista → elegir salón / para llevar → (salón) resumen para el mozo.
  const [step, setStep] = useState<'list' | 'choose' | 'dine-in'>('list')

  // Platos agrupados por categoría, en el mismo orden que el menú.
  const groups = sections
    .map((section) => ({
      section,
      lines: section.items.flatMap((item) => lines.filter((line) => line.item.id === item.id)),
    }))
    .filter((group) => group.lines.length > 0)

  return (
    <>
      {count > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-4 pb-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-4 rounded-pill bg-button px-5 py-3.5 text-button-foreground shadow-xl shadow-button/30 transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <ClipboardList className="h-5 w-5" aria-hidden />
              {t.viewOrder}
              <span className="rounded-pill bg-button-foreground/20 px-2 py-0.5 text-xs">{t.itemsCount(count)}</span>
            </span>
            <span className="font-heading text-sm">{formatPrice(total)}</span>
          </button>
        </div>
      )}

      {open && (
        <Modal
          labelledBy="order-dialog-title"
          onClose={() => {
            setOpen(false)
            setStep('list')
          }}
        >
          {(close) =>
            step === 'choose' ? (
              <OrderTypeStep onBack={() => setStep('list')} onClose={close} onDineIn={() => setStep('dine-in')} />
            ) : step === 'dine-in' ? (
              <DineInStep groups={groups} total={total} onBack={() => setStep('choose')} onClose={close} />
            ) : (
            <div className="flex flex-col">
              <div className="flex items-start justify-between gap-4 border-b border-border p-6 pb-4">
                <div>
                  <h2 id="order-dialog-title" className="font-heading text-2xl text-heading">
                    {t.orderTitle}
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{t.orderHint}</p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label={t.closeOrder}
                  className="shrink-0 rounded-pill bg-muted p-2 text-foreground transition hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="h-5 w-5" aria-hidden />
                </button>
              </div>

              {lines.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">{t.orderEmpty}</p>
              ) : (
                <>
                  <div className="space-y-5 px-6 pt-4">
                    {groups.map(({ section, lines: groupLines }) => (
                      <section key={section.id} aria-labelledby={`order-${section.id}`}>
                        <h3 id={`order-${section.id}`} className="text-[10px] font-semibold uppercase tracking-[0.25em] text-eyebrow">
                          {section.title[lang]}
                        </h3>
                        <ul className="divide-y divide-border/70">
                          {groupLines.map(({ item, quantity }) => (
                            <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                              <div className="min-w-0">
                                <p className="font-heading text-sm text-heading">{item.name[lang]}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">{formatPrice(item.price * quantity)}</p>
                              </div>
                              <QuantityStepper name={item.name[lang]} quantity={quantity} onAdd={() => add(item.id)} onRemove={() => remove(item.id)} />
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
                    <button
                      type="button"
                      onClick={() => setStep('choose')}
                      className="h-11 w-full rounded-pill bg-button px-5 text-sm font-semibold text-button-foreground transition hover:bg-button/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {t.finishOrder}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clear()
                        close()
                      }}
                      className="w-full rounded-pill border border-border py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      {t.clearOrder}
                    </button>
                  </div>
                </>
              )}
            </div>
            )
          }
        </Modal>
      )}
    </>
  )
}
